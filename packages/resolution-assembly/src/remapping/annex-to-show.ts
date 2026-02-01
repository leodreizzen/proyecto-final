import {enforceAnnexNumber} from "../validity/utils/numbers";
import {ResolutionDBDataToShow} from "../data/resolutions";
import {AnnexToShow, AnnexIndex} from "../definitions/resolutions";
import {mapContentBlocks} from "./content-blocks";
import {articleInitialDataToShow} from "./article-to-show";
import {ValidationContext} from "../processing/reference-processor";
import {checkAnnex} from "@repo/db/utils/polymorphism/annex";

export function annexInitialDataToShow(
    annex: ResolutionDBDataToShow["annexes"][0],
    overrides: { index?: AnnexIndex } | undefined,
    validationContext: ValidationContext
): AnnexToShow {
    const indexToUse = overrides?.index ?? { type: "defined", number: enforceAnnexNumber(annex.number) };

    if (annex.type === "TEXT") {
        if (!annex.annexText)
            throw new Error("Annex text information missing for annex with id " + annex.id);

        return {
            type: "TEXT",
            content: mapContentBlocks(annex.annexText.content, validationContext),
            addedBy: null,
            repealedBy: null,
            modifiedBy: [],
            index: indexToUse
        } satisfies AnnexToShow
    } else if (annex.type === "WITH_ARTICLES") {
        if (!annex.annexWithArticles)
            throw new Error("Annex with articles information missing for annex with id " + annex.id);
        return {
            type: "WITH_ARTICLES",
            initialText: annex.annexWithArticles.initialText,
            finalText: annex.annexWithArticles.finalText,
            standaloneArticles: annex.annexWithArticles.standaloneArticles.map(a => articleInitialDataToShow(a, undefined, validationContext)),
            chapters: annex.annexWithArticles.chapters.map(chapter => ({
                ...chapter,
                articles: chapter.articles.map(a => articleInitialDataToShow(a, undefined, validationContext)),
                addedBy: null,
                repealedBy: null,
            })),
            addedBy: null,
            repealedBy: null,
            index: indexToUse
        } satisfies AnnexToShow
    } else {
        const _exhaustiveCheck: never = annex.type;
        throw new Error("Unknown annex type for annex with id " + annex.id);
    }
}