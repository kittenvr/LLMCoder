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
                lines.splice(start, end - start + 2, ...change.content.split('\n'));
                break;
        }
    }

    return { processedCode: lines.join('\n') };
}

function parseMarkdownChanges(changesInput) {
    // Remove surrounding separator lines and content if present
    const cleanedInput = changesInput.replace(/^[\s\S]*?----\n([\s\S]*?)\n----[\s\S]*$/, '$1').trim();
    
    const changes = [];
    const files = cleanedInput.split(/^# /m).filter(Boolean);

    if (files.length === 0) {
        return { errorMessage: 'Error: No valid file sections found' };
    }

    for (const file of files) {
        const [fileNameAndTimestamp, ...sections] = file.trim().split(/^\*\*/m);
        
        const [fileName, datepart, timepart] = fileNameAndTimestamp.trim().split(' ');
        const timestamp = `${datepart} ${timepart}`

        if (!fileName.trim()) {
            return { errorMessage: 'Error: Empty file name' };
        }

        if (!timestamp || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(timestamp)) {
            return { errorMessage: `Error: Invalid or missing timestamp for file ${fileName.trim()}` };
        }

        if (sections.length === 0) {
            return { errorMessage: `Error: No valid sections found in file ${fileName.trim()}` };
        }
        
        for (const section of sections) {
            const change = {
                fileName: fileName.trim(),
                timestamp: timestamp,
                type: section.substring(0, section.indexOf('**'))
            };

            if (!['Remove', 'Replace', 'InsertBetween'].includes(change.type)) {
                return { errorMessage: `Error: Unknown change type ${change.type}` };
            }

            const sectionLines = section.split('\n');
            const fromLine = sectionLines.find(line => line.trim().startsWith('* From:'));
            const toLine = sectionLines.find(line => line.trim().startsWith('* To:'));
            if (!fromLine || !toLine) {
                return { errorMessage: `Error: Missing From or To in ${change.type} section` };
            }
            change.from = fromLine.replace('* From:', '').trim().replace(/^`|`$/g, '');
            change.to = toLine.replace('* To:', '').trim().replace(/^`|`$/g, '');

            if (change.type === 'Replace' || change.type === 'InsertBetween') {
                const contentStart = lines.findIndex(line => line.trim().startsWith('````'));
                const contentEnd = lines.slice(contentStart + 1).findIndex(line => line.trim() === '````') + contentStart + 1;
                if (contentStart === -1 || contentEnd === -1 || contentStart >= contentEnd) {
                    return { errorMessage: `Error: Invalid content format in ${change.type} section` };
                }
                change.content = lines.slice(contentStart + 1, contentEnd).join('\n');
            }

            changes.push(change);
        }
    }

    if (changes.length === 0) {
        return { errorMessage: 'Error: No valid changes found' };
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