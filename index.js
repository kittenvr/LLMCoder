let lastCode = '';
let formattedCode = '';

function copyToClipboard(code, elementId) {
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = code;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextArea);
    
    // Show copied message
    const messageElement = document.createElement('div');
    messageElement.textContent = 'Copied to clipboard';
    messageElement.style.position = 'absolute';
    messageElement.style.top = '5px';
    messageElement.style.right = '5px';
    messageElement.style.backgroundColor = 'rgba(0,0,0,0.7)';
    messageElement.style.color = 'white';
    messageElement.style.padding = '5px 10px';
    messageElement.style.borderRadius = '5px';
    messageElement.style.fontSize = '12px';
    
    const targetElement = document.getElementById(elementId);
    targetElement.style.position = 'relative';
    targetElement.appendChild(messageElement);
    
    setTimeout(() => {
        targetElement.removeChild(messageElement);
    }, 1000);
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
    copyToClipboard(formattedCode, 'line-numbered-code');
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
        copyToClipboard(result.processedCode, 'result-area');
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

document.getElementById('code-input').addEventListener('paste', handlePaste);
document.getElementById('changes-input').addEventListener('paste', handlePaste);

// Set initial focus to Format Code input
window.onload = function() {
    document.getElementById('code-input').focus();
};