import {
    AnnexIndex, AnnexToShow,
    ArticleToShow, ChapterToShow,
    ReferenceMarker,
    ResolutionToShow
} from "@repo/resolution-assembly/definitions/resolutions";
import { stableStringify } from "@repo/resolution-assembly";
import { formatArticleIndex, formatContentBlocks } from "./formatting";
import { IndexedBlock, ReferenceTargetKey, ArticleLocation } from "../definitions";

// --- Optimization: Inverted Index Building ---
export function buildReferenceMap(resolutionData: ResolutionToShow): Map<ReferenceTargetKey, IndexedBlock[]> {
    const map = new Map<ReferenceTargetKey, IndexedBlock[]>();

    // Helper to add to map
    const addToMap = (target: ReferenceTargetKey, item: IndexedBlock) => {
        if (!map.has(target)) map.set(target, []);
        map.get(target)!.push(item);
    };

    // Index Recitals
    resolutionData.recitals.forEach(recital => {
        recital.content.forEach(block => {
            if (block.type === "TEXT") {
                block.referenceMarkers.forEach(ref => {
                    // Index ALL references found in Recitals
                    const key = generateGenericReferenceKey(ref.data);
                    if (key) addToMap(key, { type: "RECITAL", data: recital });
                });
            }
        });
    });

    // Index Considerations (Similar logic)
    resolutionData.considerations.forEach(consideration => {
        consideration.content.forEach(block => {
            if (block.type === "TEXT") {
                block.referenceMarkers.forEach(ref => {
                    // Index ALL references found in Considerations
                    const key = generateGenericReferenceKey(ref.data);
                    if (key) addToMap(key, { type: "CONSIDERATION", data: consideration });
                });
            }
        });
    });

    return map;
}


export function findAnnex(resolutionData: ResolutionToShow, annexIndex: AnnexIndex): AnnexToShow | null {
    const indexStr = stableStringify(annexIndex);
    const annex = resolutionData.annexes.find(anx => stableStringify(anx.index) === indexStr);
    return annex || null;
}


export function findArticle(resolutionData: ResolutionToShow, location: ArticleLocation): ArticleToShow | null {
    const articleIndexStr = stableStringify(location.articleIndex);
    if (location.annexIndex === null) {
        const article = resolutionData.articles.find(art => stableStringify(art.index) === articleIndexStr);
        return article ?? null;
    } else {
        const annex = findAnnex(resolutionData, location.annexIndex);
        if (!annex) {
            return null;
        }
        if (annex.type !== "WITH_ARTICLES") {
            return null;
        }
        if (location.chapterNumber === null) {
            const article = annex.standaloneArticles.find(art => stableStringify(art.index) === articleIndexStr);
            return article || null;
        } else {
            const chapter = findChapter(annex, location.chapterNumber);
            if (!chapter) {
                return null;
            }
            const article = chapter.articles.find(art => stableStringify(art.index) === articleIndexStr);
            return article || null;
        }
    }
}

export function findChapter(annex: AnnexToShow & { type: "WITH_ARTICLES" }, chapterNumber: number): ChapterToShow | null {
    return annex.chapters.find(ch => ch.number === chapterNumber) || null;
}


export function resolveArticleReferences(article: ArticleToShow, resolutionData: ResolutionToShow, referenceMap: Map<string, IndexedBlock[]>) {
    const references: {
        target: string,
        text: string,
    }[] = [];
    const myArticleId = stableStringify(article.index);

    for (const contentBlock of article.content) {
        if (contentBlock.type === "TEXT") {
            for (const ref of contentBlock.referenceMarkers) {
                // Case 1: Internal Reference to Article (Direct Link)
                if (resolutionData.id.initial === ref.data.target.initial && resolutionData.id.number === ref.data.target.number && resolutionData.id.year === ref.data.target.year) {
                    if (ref.data.type !== "ARTICLE") {
                        continue;
                    }
                    const refTarget = ref.data.target;
                    const referencedArticle = findArticle(resolutionData, {
                        annexIndex: refTarget.annexNumber !== undefined ? {
                            type: "defined" as const,
                            number: refTarget.annexNumber
                        } : null,
                        chapterNumber: refTarget.chapterNumber ?? null,
                        articleIndex: {
                            type: "defined",
                            number: refTarget.articleNumber,
                            suffix: refTarget.articleSuffix ?? null
                        }
                    });

                    if (referencedArticle) {
                        // Fix: Self-reference Check
                        if (stableStringify(referencedArticle.index) === myArticleId) continue;

                        references.push({
                            target: `${formatArticleIndex(referencedArticle.index)} de la presente`,
                            text: formatContentBlocks(referencedArticle.content),
                        });
                    }
                } else {
                    // Case 2: Use Map to find Recitals/Considerations citing the same external/internal thing
                    const key = generateGenericReferenceKey(ref.data);
                    if (key && referenceMap.has(key)) {
                        const relatedBlocks = referenceMap.get(key)!;

                        // Deduplicate by ID/Number to avoid duplicates in list
                        const usedIds = new Set<string>();

                        for (const block of relatedBlocks) {
                            const id = `${block.type}-${block.data.number}`;
                            if (usedIds.has(id)) continue;
                            usedIds.add(id);

                            if (block.type === "RECITAL") {
                                references.push({
                                    target: `Visto número ${block.data.number}`,
                                    text: formatContentBlocks(block.data.content),
                                });
                            } else {
                                references.push({
                                    target: `Considerando número ${block.data.number}`,
                                    text: formatContentBlocks(block.data.content),
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    return references;
}

// Updated Key Generator to support External References too
export function generateGenericReferenceKey(refData: ReferenceMarker['data']): string {
    const t = refData.target;
    // TYPE-INITIAL-NUMBER-YEAR
    // If it has art number, append it.
    let base = `${refData.type}-${t.initial}-${t.number}-${t.year}`;
    if (refData.type === 'ARTICLE') {
        const t = refData.target;
        base += `:${t.annexNumber ?? 'MAIN'}:${t.chapterNumber ?? 'NOCHP'}:${t.articleNumber}:${t.articleSuffix ?? 0}`;
    }
    return base;
}
