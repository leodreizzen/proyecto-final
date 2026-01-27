import {findFuzzyRange} from "@repo/text-utils";
import {checkReference} from "@/lib/data/polymorphism/reference";
import {stableStringify} from "@/lib/utils";
import {checkResolutionsExistance} from "@/lib/data/resolutions";
import {ResolutionNaturalID} from "@/lib/definitions/resolutions";
import {
    TextReferenceWithReferenceWithoutPayload
} from "@/lib/definitions/references";


// --- Output Types ---

type BaseMarkerData = {
    valid: boolean;
    refText: string;
}

type ResolutionMarkerData = BaseMarkerData & {
    type: "RESOLUTION";
    target: { initial: string; number: number; year: number };
}

type ArticleMarkerData = BaseMarkerData & {
    type: "ARTICLE";
    target: { initial: string; number: number; year: number; articleNumber: number, articleSuffix: number, annexNumber?: number, chapterNumber?: number };
}

type AnnexMarkerData = BaseMarkerData & {
    type: "ANNEX";
    target: { initial: string; number: number; year: number; annexNumber: number };
}

type ChapterMarkerData = BaseMarkerData & {
    type: "CHAPTER";
    target: { initial: string; number: number; year: number; annexNumber: number; chapterNumber: number };
}

export type ReferenceMarker = {
    start: number;
    end: number;
    data: ResolutionMarkerData | ArticleMarkerData | AnnexMarkerData | ChapterMarkerData;
}

export type ValidationContext = Set<string>; // stableStringified keys

/**
 * Validates references against the DB.
 */
export async function validateReferences(references: TextReferenceWithReferenceWithoutPayload[]): Promise<ValidationContext> {
    const keysToCheck = new Set<string>();

    for (const ref of references) {
        // We let checkReference throw if structure is invalid, this is expected behavior.
        const r = checkReference(ref.reference);
        
        let target: { initial: string, number: number, year: number } | null = null;

        switch (r.targetType) {
            case "RESOLUTION":
                target = { initial: r.resolution.initial, number: r.resolution.number, year: r.resolution.year };
                break;
            case "ARTICLE":
                target = { initial: r.article.initial, number: r.article.resNumber, year: r.article.year };
                break;
            case "ANNEX":
                target = { initial: r.annex.initial, number: r.annex.resNumber, year: r.annex.year };
                break;
            case "CHAPTER":
                target = { initial: r.chapter.initial, number: r.chapter.resNumber, year: r.chapter.year };
                break;
        }

        if (target) {
            keysToCheck.add(stableStringify(target));
        }
    }

    if (keysToCheck.size === 0) return new Set();

    const ids = Array.from(keysToCheck).map(k => JSON.parse(k) as ResolutionNaturalID);

    const found = await checkResolutionsExistance(ids);
    const validKeys = new Set<string>();
    for (const f of found) {
        validKeys.add(stableStringify({ initial: f.initial, number: f.number, year: f.year }));
    }

    return validKeys;
}

export function processBlockReferences(
    blockText: string,
    references: TextReferenceWithReferenceWithoutPayload[],
    validKeys: ValidationContext
): ReferenceMarker[] {
    const markers: ReferenceMarker[] = [];

    for (const ref of references) {
        const fullSearchString = (ref.textBefore + " "  + ref.text + " " +  ref.textAfter).trim();
        const fullRange = findFuzzyRange(blockText, fullSearchString);

        if (!fullRange) continue;

        const foundStr = blockText.slice(fullRange.start, fullRange.end);
        const textRange = findFuzzyRange(foundStr, ref.text);

        if (!textRange) continue;

        const range = {
            start: fullRange.start + textRange.start,
            end: fullRange.start + textRange.end
        }

        const r = checkReference(ref.reference);
        let markerData: ReferenceMarker["data"] | null = null;
        
        const isValid = (initial: string, number: number, year: number) => 
            validKeys.has(stableStringify({ initial, number, year }));

        switch (r.targetType) {
            case "RESOLUTION":
                markerData = {
                    type: "RESOLUTION",
                    valid: isValid(r.resolution.initial, r.resolution.number, r.resolution.year),
                    refText: ref.text,
                    target: { initial: r.resolution.initial, number: r.resolution.number, year: r.resolution.year }
                };
                break;
            case "ARTICLE":
                markerData = {
                    type: "ARTICLE",
                    valid: isValid(r.article.initial, r.article.resNumber, r.article.year),
                    refText: ref.text,
                    target: { initial: r.article.initial, number: r.article.resNumber, year: r.article.year, articleNumber: r.article.articleNumber, articleSuffix: r.article.articleSuffix, annexNumber: r.article.annexNumber ?? undefined, chapterNumber: r.article.chapterNumber ?? undefined },
                };
                break;
            case "ANNEX":
                markerData = {
                    type: "ANNEX",
                    valid: isValid(r.annex.initial, r.annex.resNumber, r.annex.year),
                    refText: ref.text,
                    target: { initial: r.annex.initial, number: r.annex.resNumber, year: r.annex.year, annexNumber: r.annex.annexNumber }
                };
                break;
            case "CHAPTER":
                markerData = {
                    type: "CHAPTER",
                    valid: isValid(r.chapter.initial, r.chapter.resNumber, r.chapter.year),
                    refText: ref.text,
                    target: { initial: r.chapter.initial, number: r.chapter.resNumber, year: r.chapter.year, annexNumber: r.chapter.annexNumber, chapterNumber: r.chapter.chapterNumber }
                };
                break;
        }

        if (markerData) {
            markers.push({
                start: range.start,
                end: range.end,
                data: markerData
            });
        }
    }

    // Resolve overlaps
    markers.sort((a, b) => (b.end - b.start) - (a.end - a.start));
    const finalMarkers: ReferenceMarker[] = [];
    
    for (const marker of markers) {
        const overlap = finalMarkers.some(existing =>
            Math.max(marker.start, existing.start) < Math.min(marker.end, existing.end)
        );
        if (!overlap) finalMarkers.push(marker);
    }

    return finalMarkers.sort((a, b) => a.start - b.start);
}
