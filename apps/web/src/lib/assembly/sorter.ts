import {
    AnnexToShow,
    ArticleToShow,
    ChapterToShow, ConsiderationToShow,
    RecitalToShow,
    ResolutionToShow
} from "@/lib/definitions/resolutions";

function compareArticles(a: ArticleToShow, b: ArticleToShow): number {
    if (a.number !== b.number) {
        return a.number - b.number;
    }
    return a.suffix - b.suffix;
}

function compareChapters(a: ChapterToShow, b: ChapterToShow): number {
    return a.number - b.number;
}

function compareAnnexes(a: AnnexToShow, b: AnnexToShow): number {
    return a.number - b.number;
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