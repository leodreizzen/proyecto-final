import {articleInitialDataToShow} from "@/lib/data/remapping/article-to-show";
import {enforceAnnexNumber} from "@/lib/assembly/validity/utils/numbers";
import {AnnexToShow} from "@/lib/definitions/resolutions";
import {ResolutionDBDataToShow} from "@/lib/data/resolutions";
import {mapTablesToContent} from "@/lib/data/remapping/tables";

export function annexInitialDataToShow(
    annex: ResolutionDBDataToShow["annexes"][0],
    overrides?: { number?: number }
): AnnexToShow {
    const numberToUse = overrides?.number ?? annex.number;

    if (annex.type === "TEXT") {
        if (!annex.annexText)
            throw new Error("Annex text information missing for annex with id " + annex.id);

        return {
            ...annex,
            ...annex.annexText,
            type: "TEXT",
            tables: mapTablesToContent(annex.annexText.tables),
            repealedBy: null,
            modifiedBy: [],
            addedBy: null,
            number: enforceAnnexNumber(numberToUse)
        } satisfies AnnexToShow
    } else if (annex.type === "WITH_ARTICLES") {
        if (!annex.annexWithArticles)
            throw new Error("Annex with articles information missing for annex with id " + annex.id);
        return {
            ...annex,
            ...annex.annexWithArticles,
            type: "WITH_ARTICLES",
            standaloneArticles: annex.annexWithArticles.standaloneArticles.map(a => articleInitialDataToShow(a)),
            chapters: annex.annexWithArticles.chapters.map(chapter => ({
                ...chapter,
                articles: chapter.articles.map(a => articleInitialDataToShow(a)),
                addedBy: null,
                repealedBy: null,
            })),
            addedBy: null,
            repealedBy: null,
            number: enforceAnnexNumber(numberToUse)
        } satisfies AnnexToShow
    } else {
        const _exhaustiveCheck: never = annex.type;
        throw new Error("Unknown annex type for annex with id " + annex.id);
    }
}