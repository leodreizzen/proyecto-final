export function suffixToNumber(suffix: string | null | undefined): number {
    if (suffix === null || suffix === undefined || suffix.trim().length === 0)
        return 0

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

    const suffixMapped = suffixMap[suffix.trim().toLowerCase()];
    if (suffixMapped !== undefined)
        return suffixMapped;
    else {
        console.warn(`Unknown article suffix: ${suffix}`);
        return 0;
    }
}