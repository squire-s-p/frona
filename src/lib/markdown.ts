export function parseChecklist(text: string) {
    const lines = text.split("\n");
    return lines.map((line, index) => {
        const match = line.match(/^(\s*)-\s*\[( |x)\]\s*(.*)/i);
        if (match) {
            return {
                id: index,
                type: "checklist",
                indent: match[1].length,
                checked: match[2].toLowerCase() === "x",
                content: match[3],
                original: line,
            };
        }
        return {
            id: index,
            type: "text",
            content: line,
            original: line,
        };
    });
}

type ChecklistItem = {
    id: number;
    type: string;
    indent?: number;
    checked?: boolean;
    content: string;
    original: string;
};

export function stringifyChecklist(items: ChecklistItem[]) {
    return items
        .map((item) => {
            if (item.type === "checklist") {
                return `${" ".repeat(item.indent ?? 0)}- [${item.checked ? "x" : " "}] ${item.content}`;
            }
            return item.content;
        })
        .join("\n");
}

export function toggleChecklistItem(text: string, index: number) {
    const items = parseChecklist(text);
    if (items[index] && items[index].type === "checklist") {
        items[index].checked = !items[index].checked;
    }
    return stringifyChecklist(items);
}

export function isChecklistMode(text: string) {
    return /^\s*-\s*\[( |x)\]/m.test(text);
}

export function convertToChecklist(text: string) {
    const lines = text.split("\n");
    const newLines = lines.map((line) => {
        if (line.trim() === "") return line;
        if (/^\s*-\s*\[( |x)\]/i.test(line)) return line;
        const bulletMatch = line.match(/^(\s*)[-*+]\s*(.*)/);
        if (bulletMatch) {
            return `${bulletMatch[1]}- [ ] ${bulletMatch[2]}`;
        }
        return `- [ ] ${line.trim()}`;
    });
    return newLines.join("\n");
}
