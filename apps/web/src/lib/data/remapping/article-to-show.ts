import {ResolutionDBDataToShow} from "@/lib/data/resolutions";
import {ArticleIndex, ArticleToShow} from "@/lib/definitions/resolutions";
import {enforceArticleNumber} from "@/lib/assembly/validity/utils/numbers";
import {mapContentBlocks} from "@/lib/data/remapping/content-blocks";
import {ValidationContext} from "@/lib/processing/reference-processor";

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
        ...article,
        content: mapContentBlocks(article.content, validationContext),
        repealedBy: null,
        modifiedBy: [],
        addedBy: null,
        index: indexToUse
    };
}
