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

export function pathForResolution(resId: { initial: string; number: number; year: number, articleNumber?: number, annexNumber?: number, chapterNumber?: number, articleSuffix?: number }) {
    let fragment = "";
    if (resId.articleNumber !== undefined || resId.annexNumber !== undefined || resId.chapterNumber !== undefined) {
        fragment += "#";
        let prefix = "";
        if (resId.annexNumber) {
            if (resId.chapterNumber !== undefined) {
                prefix += getChapterId(resId.annexNumber, resId.chapterNumber)
            } else {
                prefix += "annex-" + resId.annexNumber;
            }
        }
        if (resId.articleNumber !== undefined) {
            prefix += "art";
            fragment += getArticleId(prefix, resId.articleNumber, resId.articleSuffix ?? 0);
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