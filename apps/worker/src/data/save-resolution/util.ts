const suffixMap: Record<string, number> = {
    'bis': 2,
    'ter': 3,
    'quater': 4,
    'quinquies': 5,
    'sexies': 6,
    'septies': 7,
    'octies': 8,
    'novies': 9,
    'decies': 10
}

export function suffixToNumber(suffix: string | null | undefined): number {
    if (suffix === null || suffix === undefined || suffix.trim().length === 0)
        return 0

    const suffixMapped = suffixMap[suffix.trim().toLowerCase()];
    if (suffixMapped !== undefined)
        return suffixMapped;
    else {
        console.warn(`Unknown article suffix: ${suffix}`);
        return 0;
    }
}

export function stringifySuffix(suffixNumber: number): string | null {
    if (suffixNumber === 0)
        return null;

    const numberMap: Record<number, string> = {};
    for (const [key, value] of Object.entries(suffixMap)) {
        numberMap[value] = key;
    }

    const suffix = numberMap[suffixNumber];
    if (suffix !== undefined)
        return suffix;
    else {
        console.warn(`Unknown article suffix number: ${suffixNumber}`);
        return null;
    }
}