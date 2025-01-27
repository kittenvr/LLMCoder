/* ==UserScript==
   @name        LLMCoder
   @namespace   Violentmonkey Scripts
   @match       *://*/*
   @grant       none
   @version     1.0
   @author      -
   @description 3/8/2020, 8:42:28 PM
   ==/UserScript== */

let lastCode = '';
let formattedCode = '';

function copyToClipboard(code, messageId) {
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = code;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextArea);
    
    const messageElement = document.getElementById(messageId);
    messageElement.textContent = 'Copied to clipboard';
    
    setTimeout(() => {
        messageElement.textContent = '';
    }, 3000);
}

function formatCode(code) {
    // 統一將所有的行結束符轉換為 \n
    code = code.replace(/\r\n/g, '\n');

    // 檢查是否為多文件格式
    if (code.trim().startsWith('## File:')) {
        const files = code.split('## File:');
        let formattedCode = '';

        for (let i = 1; i < files.length; i++) {
            const [fileName, ...contentLines] = files[i].trim().split('\n');
            const codeContent = contentLines.join('\n').trim();
            const languageMatch = codeContent.match(/```(\w+)\n/);
            const language = languageMatch ? languageMatch[1] : '';
            const actualCode = codeContent.replace(/```\w*\n|```$/g, '');

            const lines = actualCode.split('\n');
            // 移除最後一個元素，如果它是空字符串
            if (lines[lines.length - 1] === '') {
                lines.pop();
            }
            const maxLineNumWidth = String(lines.length).length;
            const numberedLines = lines.map((line, index) =>
                `${(index + 1).toString().padStart(maxLineNumWidth)}. ${line}`
            ).join('\n');

            formattedCode += `## File: ${fileName.trim()}\n\`\`\`${language}\n${numberedLines}\n\`\`\`\n\n`;
        }

        return formattedCode.trim();
    } else {
        // 單一文本內容格式
        const lines = code.split('\n');
        // 移除最後一個元素，如果它是空字符串
        if (lines[lines.length - 1] === '') {
            lines.pop();
        }
        const maxLineNumWidth = String(lines.length).length;
        const numberedLines = lines.map((line, index) =>
            `${(index + 1).toString().padStart(maxLineNumWidth)}. ${line}`
        ).join('\n');

        return numberedLines;
    }
}

function handleCodeInput(e) {
    e.preventDefault();
    const code = e.clipboardData.getData('text');
    formattedCode = formatCode(code);
    lastCode = code;  // Store the original code
    document.getElementById('line-numbered-code').textContent = formattedCode;
    copyToClipboard(formattedCode, 'formatted-code-message');
    document.getElementById('changes-input').value = '';
    document.getElementById('result-area').textContent = '';
    document.getElementById('changes-input').focus();
    e.target.value = code;
}

function handleChangesInput(e) {
    e.preventDefault();
    const changesInput = e.clipboardData.getData('text').replace(/\r\n/g, '\n');
    e.target.value = changesInput;

    if (!lastCode) {
        document.getElementById('result-area').textContent = 'Error: No code to process. Please format code first.';
        return;
    }

    const result = processChanges(lastCode, changesInput);
    document.getElementById('result-area').textContent = result.processedCode || result.errorMessage;
    if (result.processedCode) {
        copyToClipboard(result.processedCode, 'result-message');
        document.getElementById('code-input').value = '';
        document.getElementById('line-numbered-code').textContent = '';
        document.getElementById('code-input').focus();
        return;
    }
}

function handlePaste(e) {
    const targetId = e.target.id;
    if (targetId === 'code-input') {
        handleCodeInput(e);
    } else if (targetId === 'changes-input') {
        handleChangesInput(e);
    }
}

function isViolentmonkey() {
    return typeof GM_info !== 'undefined' && GM_info.scriptHandler === 'Violentmonkey';
}

if (isViolentmonkey()) {
    document.getElementById('code-input').addEventListener('paste', handlePaste);
    document.getElementById('changes-input').addEventListener('paste', handlePaste);
} else {
    document.getElementById('code-input').addEventListener('paste', handlePaste);
    document.getElementById('changes-input').addEventListener('paste', handlePaste);
}

// Set initial focus to Format Code input
window.onload = function() {
    document.getElementById('code-input').focus();
};

function sortChanges(changes) {
    return changes.sort((a, b) => {
        const aStart = parseInt(a.from.split('.')[0]);
        const bStart = parseInt(b.from.split('.')[0]);
        return aStart - bStart;
    });
}

function processChanges(lastCode, changesInput) {
    if (!lastCode.trim()) {
        return { errorMessage: 'Error: Empty code input' };
    }
    if (!changesInput.trim()) {
        return { errorMessage: 'Error: Empty changes input' };
    }

    const changes = parseMarkdownChanges(changesInput);

    if (changes.errorMessage) {
        return changes;
    }

    if (!Array.isArray(changes)) {
        return { errorMessage: 'Error: No changes found'};
    }

    let lines = lastCode.split('\n');
    const sortedChanges = sortChanges(changes);
    for (const change of sortedChanges.reverse()) {
        const [start, end] = getLineRange(change, lines.length);

        const firstOriginalLine = lines[start].trim();
        const lastOriginalLine = lines[end].trim();
        if (change.from.split('.').slice(1).join('.').trim() !== firstOriginalLine) {
            const contextLines = lines.slice(Math.max(0, start - 2), Math.min(lines.length, start + 3));
            const context = contextLines.map((line, i) => `${i + Math.max(0, start - 2) + 1}: ${line}`).join('\n');
            const errorMessage = `Error: Original text mismatch at From line ${start + 1}.\n` +
                                 `Expected From: ${start + 1}. ${change.from.split('.').slice(1).join('.').trim()}\n` +
                                 `Found    From: ${start + 1}. ${firstOriginalLine}\n` +
                                 `Context:\n${context}`;
            return { errorMessage };
        }
        if (change.to.split('.').slice(1).join('.').trim() !== lastOriginalLine) {
            const contextLines = lines.slice(Math.max(0, end - 2), Math.min(lines.length, end + 3));
            const context = contextLines.map((line, i) => `${i + Math.max(0, end - 2) + 1}: ${line}`).join('\n');
            const errorMessage = `Error: Original text mismatch at To line ${end + 1}.\n` +
                                 `Expected To: ${end + 1}. ${change.to.split('.').slice(1).join('.').trim()}\n` +
                                 `Found    To: ${end + 1}. ${lastOriginalLine}\n` +
                                 `Context:\n${context}`;
            return { errorMessage };
        }

        switch (change.type) {
            case 'Remove':
                lines.splice(start, end - start + 1);
                break;
            case 'InsertBetween':
                lines.splice(start + 1, 0, ...change.content.split('\n'));
                break;
            case 'Replace':
                lines.splice(start, end - start + 1, ...change.content.split('\n'));
                //lines.splice(start, end - start + 1, ...change.content.split('\n').map((line, index, array) => 
                //    index === array.length - 1 ? line + '\n' : line
                //));
                break;
        }
    }

    return { processedCode: lines.join('\n') };
}

function parseMarkdownChanges(changesInput) {
    // Remove surrounding separator lines and content if present
    //const cleanedInput = changesInput.replace(/^[\s\S]*?----\n([\s\S]*?)\n----[\s\S]*$/, '$1').trim();
    // Remove surrounding XML tags if present
    //const cleanedInput = changesInput.replace(/<antArtifact[^>]*>([\s\S]*?)<\/antArtifact>/g, '$1').trim();
    
    const changes = [];
    let currentFile = null;
    let inCodeBlock = false;
    const lines = changesInput.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith('# ') && !inCodeBlock) {
            if (currentFile) {
                changes.push(...parseFileChanges(currentFile));
            }
            currentFile = { name: line.substring(2).trim(), sections: [] };
        } else if (line.startsWith('**') && !inCodeBlock) {
            if (currentFile) {
                currentFile.sections.push({ type: line.substring(2).trim(), lines: [] });
            }
        } else if (line.startsWith('````')) {
            inCodeBlock = !inCodeBlock;
            if (currentFile && currentFile.sections.length > 0) {
                currentFile.sections[currentFile.sections.length - 1].lines.push(line);
            }
        } else {
            if (currentFile && currentFile.sections.length > 0) {
                currentFile.sections[currentFile.sections.length - 1].lines.push(line);
            }
        }
    }

    if (currentFile) {
        changes.push(...parseFileChanges(currentFile));
    }

    if (changes.length === 0) {
        return { errorMessage: 'Error: No valid changes found' };
    }

    return changes;
}

function parseFileChanges(file) {
    const changes = [];
    const [fileName, datepart, timepart] = file.name.split(' ');
    const timestamp = `${datepart} ${timepart}`;

    if (!fileName.trim()) {
        return [{ errorMessage: 'Error: Empty file name' }];
    }

    if (!timestamp || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(timestamp)) {
        return [{ errorMessage: `Error: Invalid or missing timestamp for file ${fileName.trim()}` }];
    }

    for (const section of file.sections) {
        const change = {
            fileName: fileName.trim(),
            timestamp: timestamp,
            type: section.type.substring(0, section.type.indexOf('**'))
        };

        if (!['Remove', 'Replace', 'InsertBetween'].includes(change.type)) {
            return [{ errorMessage: `Error: Unknown change type ${change.type}` }];
        }

        const fromLine = section.lines.find(line => line.trim().startsWith('* From:'));
        const toLine = section.lines.find(line => line.trim().startsWith('* To:'));
        if (!fromLine || !toLine) {
            return [{ errorMessage: `Error: Missing From or To in ${change.type} section` }];
        }
        change.from = fromLine.replace('* From:', '').trim().replace(/^`|`$/g, '');
        change.to = toLine.replace('* To:', '').trim().replace(/^`|`$/g, '');

        if (change.type === 'Replace' || change.type === 'InsertBetween') {
            const contentStart = section.lines.findIndex(line => line.trim().startsWith('````'));
            const contentEnd = section.lines.slice(contentStart + 1).findIndex(line => line.trim() === '````') + contentStart + 1;
            if (contentStart === -1 || contentEnd === -1 || contentStart >= contentEnd) {
                return [{ errorMessage: `Error: Invalid content format in ${change.type} section` }];
            }
            change.content = section.lines.slice(contentStart + 1, contentEnd).join('\n');
        }

        changes.push(change);
    }

    return changes;
}

function getLineRange(change, totalLines) {
    const start = parseInt(change.from.split('.')[0]) - 1;
    const end = parseInt(change.to.split('.')[0]) - 1;
    return [
        Math.max(0, Math.min(start, totalLines - 1)),
        Math.max(0, Math.min(end, totalLines - 1))
    ];
}

:root {
    --bg-color: #1e1e1e;
    --text-color: #e0e0e0;
    --primary-color: #646cff;
    --secondary-color: #535bf2;
    --input-bg: #2a2a2a;
    --status-bg: #2a2a2a;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: var(--bg-color);
    color: var(--text-color);
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    overflow: hidden;
}

.container {
    width: 98%;
    display: flex;
    flex-direction: column;
    height: 95vh;
}

header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

h1 {
    color: var(--primary-color);
    font-size: 1.5rem;
}

.github-link {
    color: var(--text-color);
    font-size: 1.5rem;
    text-decoration: none;
    transition: color 0.3s ease;
}

.github-link:hover {
    color: var(--primary-color);
}

h2 {
    color: var(--secondary-color);
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
}

.code-section {
    flex: 1;
    display: flex;
    flex-direction: row;
    overflow: hidden;
}

.input-area, .output-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.output-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-left: 1rem;
}

.output-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.copy-message {
    font-size: 0.8rem;
    color: var (--text-color);
}

textarea, .line-numbered-area {
    flex: 1;
    background-color: var(--input-bg);
    color: var(--text-color);
    border: 1px solid var(--primary-color);
    border-radius: 5px;
    padding: 0.5rem;
    font-family: 'Fira Code', monospace;
    font-size: 0.9rem;
    resize: none;
    overflow: auto;
    white-space: pre;
}

@media (max-height: 600px) {
    .container {
        height: 98vh;
    }
    
    h1, .github-link {
        font-size: 1.2rem;
    }
    
    h2 {
        font-size: 1rem;
        margin-bottom: 0.3rem;
    }
    
    textarea, .line-numbered-area {
        font-size: 0.8rem;
    }
}

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LLM Coder</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <link rel="stylesheet" href="index.css">
    <script src="https://cdn.jsdelivr.net/gh/ChrisTorng/LLMCoder/markdown_process.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/ChrisTorng/LLMCoder/index.js"></script>
</head>

<body>
    <div class="container">
        <header>
            <h1><a href="https://christorng.github.io/LLMCoder/">LLM Coder</a></h1>
            <a href="https://github.com/ChrisTorng/LLMCoder" target="_blank" rel="noopener noreferrer"
                class="github-link">
                <i class="fab fa-github"></i>
            </a>
        </header>
        <div class="code-section">
            <div class="input-area">
                <h2>Source Code</h2>
                <textarea id="code-input" name="code" placeholder="Paste and auto format code"></textarea>
            </div>
            <div class="output-area">
                <div class="output-header">
                    <h2>Formatted Code</h2>
                    <span id="formatted-code-message" class="copy-message"></span>
                </div>
                <div id="line-numbered-code" class="line-numbered-area"></div>
            </div>
        </div>
        <div class="code-section">
            <div class="input-area">
                <!-- <h2>JSON</h2>
                <textarea id="changes-input" name="changes" placeholder="Paste JSON string"></textarea> -->
                <h2>Markdown</h2>
                <textarea id="changes-input" name="changes" placeholder="Paste Markdown string"></textarea>
            </div>
            <div class="output-area">
                <div class="output-header">
                    <h2>Result</h2>
                    <span id="result-message" class="copy-message"></span>
                </div>
                <div id="result-area" class="line-numbered-area"></div>
            </div>
        </div>
    </div>
</body>

</html>

function interactWithClaudeAI() {
    const chatInput = document.querySelector('.chat-input');
    const sendButton = document.querySelector('.send-button');

    if (chatInput && sendButton) {
        chatInput.value = formattedCode;
        sendButton.click();

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    const response = mutation.addedNodes[0].textContent;
                    if (response.includes('Your changes have been applied')) {
                        const modifiedCode = response.split('```')[1];
                        copyToClipboard(modifiedCode, 'result-message');
                        observer.disconnect();
                    }
                }
            });
        });

        observer.observe(document.querySelector('.chat-messages'), { childList: true });
    }
}

if (isViolentmonkey()) {
    interactWithClaudeAI();
}
