function sortChanges(changes) {
    return changes.sort((a, b) => {
        const aStart = parseInt(a.lines.split('-')[0]);
        const bStart = parseInt(b.lines.split('-')[0]);
        return aStart - bStart;
    });
}

function processChanges(lastCode, changesInput) {
    let changes;
    try {
        changes = JSON.parse(changesInput);
    } catch (error) {
        return { errorMessage: 'Error: Invalid JSON input' };
    }

    if (!lastCode) {
        return { errorMessage: 'Error: No code to process. Please format code first.' };
    }

    let lines = lastCode.split('\n');
    const sortedChanges = sortChanges(changes);

    for (const change of sortedChanges.reverse()) {
        const [start, end] = change.lines.includes('-') 
            ? change.lines.split('-').map(n => parseInt(n) - 1)
            : [parseInt(change.lines) - 1, parseInt(change.lines) - 1];

        const firstOriginalLine = lines[start].trim();
        if (change.first_original_line.trim() !== firstOriginalLine) {
            const contextLines = lines.slice(Math.max(0, start-2), Math.min(lines.length, end+3));
            const context = contextLines.map((line, i) => `${i + Math.max(0, start-2) + 1}: ${line}`).join('\n');
            const errorMessage = `Error: Original text mismatch at line ${start + 1}.\n` +
                                 `Expected: '${change.first_original_line.trim()}'\n` +
                                 `Found   : '${firstOriginalLine}'\n` +
                                 `Context:\n${context}`;
            return { errorMessage };
        }

        switch (change.type) {
            case 'remove':
                lines.splice(start, end - start + 1);
                break;
            case 'insertAfter':
                lines.splice(start + 1, 0, ...change.text.split('\n'));
                break;
            case 'replace':
                lines.splice(start, end - start + 1, ...change.text.split('\n'));
                break;
        }
    }

    return { processedCode: lines.join('\n') };
}
