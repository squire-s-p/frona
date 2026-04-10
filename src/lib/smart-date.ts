import * as chrono from 'chrono-node';

export type SmartDateResult = {
    date: Date;
    text: string;
    index: number;
};

export function parseSmartDate(text: string): SmartDateResult | null {
    // Try Ukrainian first, then Russian, then English
    const options = { forwardDate: true };
    const refDate = new Date();

    let results = chrono.uk.parse(text, refDate, options);

    if (results.length === 0) {
        results = chrono.ru.parse(text, refDate, options);
    }

    if (results.length === 0) {
        results = chrono.parse(text, refDate, options);
    }

    if (results.length === 0) return null;

    // Take the first result
    const result = results[0];
    const date = result.start.date();

    return {
        date,
        text: result.text,
        index: result.index,
    };
}

export function formatSmartDateSuggestion(date: Date): string {
    return date.toLocaleDateString("uk-UA", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });
}
