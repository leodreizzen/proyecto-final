import {ResolutionDBDataToShow} from "../data/resolutions";
import {ArticleToShow, ArticleIndex} from "../definitions/resolutions";
import {mapContentBlocks} from "./content-blocks";
import {ValidationContext} from "../processing/reference-processor";
import {enforceArticleNumber} from "../validity/utils/numbers";

export function articleInitialDataToShow(
    article: ResolutionDBDataToShow["articles"][0],
    overrides: { index?: ArticleIndex } | undefined,
    validationContext: ValidationContext
): ArticleToShow {
    const indexToUse = overrides?.index ?? {
        type: "defined",
        number: enforceArticleNumber(article.number),
        suffix: article.suffix || 0
    };

    return {
        uuid: article.id,
        content: mapContentBlocks(article.content, validationContext),
        repealedBy: null,
        modifiedBy: [],
        addedBy: null,
        index: indexToUse
    };
}
