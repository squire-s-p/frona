export type Priority = "LOW" | "MEDIUM" | "HIGH";

export type SmartPriorityResult = {
    priority: Priority;
    text: string;     // The original text segment that was matched (e.g. "!!!")
    cleanText: string; // The text without the priority pattern
};

export function parseSmartPriority(text: string): SmartPriorityResult | null {
    // Check for patterns at the end of the string or separated by space
    // We use regex to find these patterns.
    // We want to match:
    // !!! or !urgent -> URGENT
    // !! or !high -> HIGH
    // ! or !low -> LOW
    // !medium -> MEDIUM

    // Rules:
    // 1. "!!!" at the end of string or followed by space
    if (/(^|\s)(!!!|!urgent|!u)(\s|$)/i.test(text)) {
        return {
            priority: "HIGH",
            text: text.match(/(^|\s)(!!!|!urgent|!u)(\s|$)/i)?.[0].trim() || "!!!",
            cleanText: text.replace(/(^|\s)(!!!|!urgent|!u)(\s|$)/i, " ").trim()
        };
    }

    // 2. "!!" at the end of string or followed by space
    // Also match "!high" or "!h" case insensitively
    if (/(^|\s)(!!|!high|!h)(\s|$)/i.test(text)) {
        return {
            priority: "HIGH",
            text: text.match(/(^|\s)(!!|!high|!h)(\s|$)/i)?.[0].trim() || "!!",
            cleanText: text.replace(/(^|\s)(!!|!high|!h)(\s|$)/i, " ").trim()
        };
    }

    // 3. "!medium"
    if (/(^|\s)(!medium|!m)(\s|$)/i.test(text)) {
        return {
            priority: "MEDIUM",
            text: text.match(/(^|\s)(!medium|!m)(\s|$)/i)?.[0].trim() || "!medium",
            cleanText: text.replace(/(^|\s)(!medium|!m)(\s|$)/i, " ").trim()
        };
    }

    // 4. "!" or "!low"
    // Note: "!" is tricky because it's a common punctuation.
    // TickTick treats "!" at the end of the line as Low priority sometimes, or "!low".
    // Let's be careful with single "!". Maybe only strict "!low" or space + "!" + space/end?
    // User asked for "!" -> Low. Let's try to match it carefully.
    if (/(^|\s)(!|!low|!l)(\s|$)/i.test(text)) {
        // We need to exclude cases where ! is part of a word like "Hi!" (regex handles ^|\s)
        return {
            priority: "LOW",
            text: text.match(/(^|\s)(!|!low|!l)(\s|$)/i)?.[0].trim() || "!",
            cleanText: text.replace(/(^|\s)(!|!low|!l)(\s|$)/i, " ").trim()
        };
    }

    return null;
}
