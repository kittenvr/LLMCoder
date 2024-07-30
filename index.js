let lastCode = '';
let formattedCode = '';

function copyToClipboard(code) {
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = code;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextArea);
    console.log('Code copied to clipboard');
}

function updateStatus(targetId, message) {
    const targetElement = document.getElementById(targetId);
    targetElement.innerHTML = `<div class="status">${message}</div>`;
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
    updateStatus('formatted-code', `Code formatted and copied to clipboard.`);
    copyToClipboard(formattedCode);
    e.target.value = code;
}

function sortChanges(changes) {
    return changes.sort((a, b) => {
        const aStart = parseInt(a.lines.split('-')[0]);
        const bStart = parseInt(b.lines.split('-')[0]);
        return aStart - bStart;
    });
}

function handleChangesInput(e) {
    e.preventDefault();
    const changesInput = e.clipboardData.getData('text').replace(/\r\n/g, '\n');
    let changes;
    try {
        changes = JSON.parse(changesInput);
    } catch (error) {
        updateStatus('processed-code', 'Error: Invalid JSON input');
        return;
    }

    if (!lastCode) {
        updateStatus('processed-code', 'Error: No code to process. Please format code first.');
        return;
    }

    let lines = formattedCode.split('\n');
    const sortedChanges = sortChanges(changes);

    for (const change of sortedChanges.reverse()) {
        const [start, end] = change.lines.includes('-') 
            ? change.lines.split('-').map(n => parseInt(n) - 1)
            : [parseInt(change.lines) - 1, parseInt(change.lines) - 1];

        const firstOriginalLine = lines[start].trim();
        if (change.first_original_line.trim() !== firstOriginalLine) {
            const contextLines = lines.slice(Math.max(0, start-2), Math.min(lines.length, end+3));
            const context = contextLines.map((line, i) => `${i + Math.max(0, start-2) + 1}: ${line}`).join('<br>');
            const errorMessage = `<b>Error:</b> Original text mismatch at line ${start + 1}.<br>` +
                                 `<b>Expected:</b> '${change.first_original_line.trim()}'<br>` +
                                 `<b>Found:</b> '${firstOriginalLine}'<br>` +
                                 `<b>Context:</b><br>${context}`;
            updateStatus('processed-code', errorMessage);
            return;
        }

        switch (change.type) {
            case 'remove':
                lines.splice(start, end - start + 1);
                break;
            case 'insertafter':
                lines.splice(start + 1, 0, ...change.text.split('\n'));
                break;
            case 'replace':
                lines.splice(start, end - start + 1, ...change.text.split('\n'));
                break;
        }
    }

    const processedCode = lines.join('\n');
    lastCode = processedCode;  // Update the stored code
    formattedCode = processedCode;  // Update the formatted code
    updateStatus('processed-code', `Changes processed and code copied to clipboard: ${sortedChanges.length} changes made.`);
    copyToClipboard(processedCode);
    e.target.value = changesInput;
}

function handlePaste(e) {
    const targetId = e.target.id;
    if (targetId === 'code-input') {
        handleCodeInput(e);
    } else if (targetId === 'changes-input') {
        handleChangesInput(e);
    }
}

document.getElementById('code-input').addEventListener('paste', handlePaste);
document.getElementById('changes-input').addEventListener('paste', handlePaste);

// Set initial focus to Format Code input
window.onload = function() {
    document.getElementById('code-input').focus();
};