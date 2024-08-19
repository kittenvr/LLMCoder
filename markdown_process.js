function sortChanges(changes) {
    return changes.sort((a, b) => {
        const aStart = parseInt(a.from.split('.')[0]);
        const bStart = parseInt(b.from.split('.')[0]);
        return aStart - bStart;
    });
}

function processChanges(lastCode, changesInput) {
    const changes = parseMarkdownChanges(changesInput);
    if (changes.errorMessage) {
        return changes;
    }

    let lines = lastCode.split('\n');
    const sortedChanges = sortChanges(changes);

    for (const change of sortedChanges.reverse()) {
        const [start, end] = getLineRange(change, lines.length);
        
        const firstOriginalLine = lines[start].trim();
        if (change.from.split('.').slice(1).join('.').trim() !== firstOriginalLine) {
            const contextLines = lines.slice(Math.max(0, start - 2), Math.min(lines.length, end + 3));
            const context = contextLines.map((line, i) => `${i + Math.max(0, start - 2) + 1}: ${line}`).join('\n');
            const errorMessage = `Error: Original text mismatch at line ${start + 1}.\n` +
                                 `Expected: '${change.from.split('.').slice(1).join('.').trim()}'\n` +
                                 `Found   : '${firstOriginalLine}'\n` +
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
                break;
        }
    }

    return { processedCode: lines.join('\n') };
}

function parseMarkdownChanges(changesInput) {
    const changes = [];
    const files = changesInput.split(/^# /m).filter(Boolean);

    for (const file of files) {
        const [fileName, ...sections] = file.trim().split(/^## /m);
        
        for (const section of sections) {
            const [type, ...lines] = section.trim().split('\n');
            const change = { type, fileName: fileName.trim() };

            if (type === 'Remove' || type === 'Replace') {
                const fromLine = lines.find(line => line.startsWith('* From:'));
                const toLine = lines.find(line => line.startsWith('* To  :'));
                if (!fromLine || !toLine) {
                    return { errorMessage: `Error: Invalid ${type} section format` };
                }
                change.from = fromLine.replace('* From:', '').trim();
                change.to = toLine.replace('* To  :', '').trim();
            } else if (type === 'InsertBetween') {
                const fromLine = lines.find(line => line.startsWith('* From:'));
                const toLine = lines.find(line => line.startsWith('* To  :'));
                if (!fromLine || !toLine) {
                    return { errorMessage: 'Error: Invalid InsertBetween section format' };
                }
                change.from = fromLine.replace('* From:', '').trim();
                change.to = toLine.replace('* To  :', '').trim();
            } else {
                return { errorMessage: `Error: Unknown change type ${type}` };
            }

            if (type === 'Replace' || type === 'InsertBetween') {
                const contentStart = lines.findIndex(line => line.startsWith('<pre>'));
                const contentEnd = lines.findIndex(line => line.startsWith('</pre>'));
                if (contentStart === -1 || contentEnd === -1 || contentStart >= contentEnd) {
                    return { errorMessage: `Error: Invalid content format in ${type} section` };
                }
                change.content = lines.slice(contentStart + 1, contentEnd).join('\n');
            }

            changes.push(change);
        }
    }

    return changes;
}

function getLineRange(change, totalLines) {
    const start = parseInt(change.from.split('.')[0]) - 1;
    let end;
    if (change.type === 'InsertBetween') {
        end = start;
    } else {
        end = parseInt(change.to.split('.')[0]) - 1;
    }
    return [
        Math.max(0, Math.min(start, totalLines - 1)),
        Math.max(0, Math.min(end, totalLines - 1))
    ];
}