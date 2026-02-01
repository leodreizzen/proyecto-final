import {
    AnnexToShow,
    ArticleToShow,
    ChapterToShow, ConsiderationToShow,
    RecitalToShow,
    ResolutionToShow,
    ArticleIndex,
    AnnexIndex
} from "./definitions/resolutions";

function compareArticleIndices(a: ArticleIndex, b: ArticleIndex): number {
    if (a.type === "defined" && b.type === "generated") return -1;
    if (a.type === "generated" && b.type === "defined") return 1;
    
    if (a.type === "defined" && b.type === "defined") {
        if (a.number !== b.number) return a.number - b.number;
        return a.suffix - b.suffix;
    }

    return (a as typeof a & {type: "generated"}).value - (b as typeof b & {type: "generated"}).value;
}

function compareAnnexIndices(a: AnnexIndex, b: AnnexIndex): number {
    if (a.type === "defined" && b.type === "generated") return -1;
    if (a.type === "generated" && b.type === "defined") return 1;

    if (a.type === "defined" && b.type === "defined") {
        return a.number - b.number;
    }

    return (a as typeof a & {type: "generated"}).value - (b as typeof b & {type: "generated"}).value;
}

function compareArticles(a: ArticleToShow, b: ArticleToShow): number {
    return compareArticleIndices(a.index, b.index);
}

function compareChapters(a: ChapterToShow, b: ChapterToShow): number {
    return a.number - b.number;
}

function compareAnnexes(a: AnnexToShow, b: AnnexToShow): number {
    return compareAnnexIndices(a.index, b.index);
}

function compareRecitals(a: RecitalToShow , b: RecitalToShow): number {
    return a.number - b.number;
}

function compareConsiderations(a: ConsiderationToShow, b: ConsiderationToShow): number {
    return a.number - b.number;
}

/**
 * Sorts the resolution and its components, in place
 */
export function sortResolution(resolution: ResolutionToShow): ResolutionToShow {
    resolution.recitals.sort(compareRecitals);

    resolution.considerations.sort(compareConsiderations);

    resolution.articles.sort(compareArticles);

    resolution.annexes.sort(compareAnnexes);

    for (const annex of resolution.annexes) {
        if (annex.type === "WITH_ARTICLES") {
            annex.chapters.sort(compareChapters);
            
            annex.standaloneArticles.sort(compareArticles);

            for (const chapter of annex.chapters) {
                chapter.articles.sort(compareArticles);
            }
        }
    }

    return resolution;
}