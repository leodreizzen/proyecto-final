export function enforceArticleNumber(number: number | null): number {
    if (number === null) {
        throw new Error("Article number cannot be null");
    }
    return number;
}

export function enforceAnnexNumber(number: number | null): number {
    if (number === null) {
        throw new Error("Annex number cannot be null");
    }
    return number;
}