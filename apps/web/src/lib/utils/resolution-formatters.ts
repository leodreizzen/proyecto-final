export function getSuffixOrdinal(suffix: number): string {
    if (suffix <= 0) return "";
    const ordinals = ["", "BIS", "TER", "QUATER", "QUINQUIES", "SEXIES", "SEPTIES", "OCTIES", "NONIES", "DECIES"];
    // Fallback for > 10 if needed, or just return suffix number
    return ordinals[suffix] || `(${suffix})`;
}

export function formatArticleTitle(number: number, suffix: number): string {
    const suffixText = getSuffixOrdinal(suffix);
    return `ARTÍCULO ${number}º${suffixText ? ` ${suffixText}` : ''}`;
}

export function getArticleId(prefix: string, number: number, suffix: number): string {
    const suffixPart = suffix > 0 ? `-${suffix}` : '';
    return `${prefix}-${number}${suffixPart}`;
}

export function getChapterId(annexNumber: number, chapterNumber: number): string {
    return `annex-${annexNumber}-chapter-${chapterNumber}`;
}