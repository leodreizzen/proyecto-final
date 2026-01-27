import {ArticleIndex, AnnexIndex} from "@/lib/definitions/resolutions";

export function getSuffixOrdinal(suffix: number): string {
    if (suffix < 0) return "";
    const ordinals = ["", "", "BIS", "TER", "QUATER", "QUINQUIES", "SEXIES", "SEPTIES", "OCTIES", "NONIES", "DECIES"];
    // Fallback for > 10 if needed, or just return suffix number
    return ordinals[suffix] ?? `(${suffix})`;
}

export function formatArticleTitle(index: ArticleIndex): string {
    if (index.type === "generated") {
        return "ARTÍCULO (SIN NÚMERO)";
    }
    const suffixText = getSuffixOrdinal(index.suffix);
    return `ARTÍCULO ${index.number}º${suffixText ? ` ${suffixText}` : ''}`;
}

export function getArticleId(prefix: string, index: ArticleIndex): string {
    if (index.type === "generated") {
        return `${prefix}-gen-${index.value}`;
    }
    const suffixPart = index.suffix > 0 ? `-${index.suffix}` : '';
    return `${prefix}-${index.number}${suffixPart}`;
}

export function getChapterId(annexNumber: number | AnnexIndex, chapterNumber: number): string {
    const annexNumStr = (typeof annexNumber === "object" && annexNumber.type === "generated") 
        ? `gen-${annexNumber.value}` 
        : (typeof annexNumber === "object" ? annexNumber.number : annexNumber);
        
    return `annex-${annexNumStr}-chapter-${chapterNumber}`;
}