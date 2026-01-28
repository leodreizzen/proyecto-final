import {ResolutionNaturalID} from "@/lib/definitions/resolutions";
import {getArticleId, getChapterId} from "@/lib/utils/resolution-formatters";

const paramsRegex = /^(\w+)-(\d+)-(\d+)$/;

export function slugToResID(publicId: string) {
    const match = publicId.match(paramsRegex);
    if (!match) {
        return null;
    }
    const [, initial, number, year] = match;
    return {
        initial: initial!.toUpperCase(),
        number: parseInt(number!, 10),
        year: parseInt(year!, 10)
    }
}

export function resIDToSlug(resId: { initial: string; number: number; year: number }) {
    if (resId.initial.includes('-')) {
        throw new Error("Invalid initial: cannot contain hyphens");
    }
    return encodeURIComponent(`${resId.initial.toUpperCase()}-${resId.number}-${resId.year}`);
}

export function pathForResolution(resId: { initial: string; number: number; year: number, articleNumber?: number | null, annexNumber?: number| null, chapterNumber?: number| null, articleSuffix?: number| null }) {
    let fragment = "";

    if (typeof resId.articleNumber === "number" || typeof resId.annexNumber === "number" || typeof resId.chapterNumber === "number") {
        fragment += "#";
        let prefix = "";
        if (typeof resId.annexNumber === "number") {
            if (typeof resId.chapterNumber === "number") {
                prefix += getChapterId(resId.annexNumber, resId.chapterNumber)
            } else {
                prefix += "annex-" + resId.annexNumber;
            }
        }
        if (typeof resId.articleNumber === "number") {
            prefix += "art";
            fragment += getArticleId(prefix, { 
                type: "defined", 
                number: resId.articleNumber, 
                suffix: resId.articleSuffix ?? 0 
            });
        }
        else {
            fragment += prefix;
        }
    }
    return `/resolution/${resIDToSlug(resId)}${fragment}`;
}


export function changeDateInResolutionParams(resolutionId: ResolutionNaturalID, searchParams: URLSearchParams, date: Date | null) {
    const newSearchParams = new URLSearchParams(searchParams);

    if (date)
        newSearchParams.set("date", date.toISOString());
    else
        newSearchParams.delete("date");

    const slug = resIDToSlug(resolutionId);

    return `/resolution/${slug}?${newSearchParams.toString()}`;
}