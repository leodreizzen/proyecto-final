import {ResolutionDBDataToShow} from "@/lib/data/resolutions";
import {ArticleToShow} from "@/lib/definitions/resolutions";
import {enforceArticleNumber} from "@/lib/assembly/validity/utils/numbers";
import {mapTablesToContent} from "@/lib/data/remapping/tables";
import {parseToContentBlocks} from "@/lib/utils/content-block-parser";

export function articleInitialDataToShow(

    article: ResolutionDBDataToShow["articles"][0],

    overrides?: { number?: number; suffix?: number | null }

): ArticleToShow {
    const numberToUse = overrides?.number ?? article.number;
    const suffixToUse = overrides?.suffix ?? article.suffix;

    const tables = mapTablesToContent(article.tables);

    return {
        ...article,
        content: parseToContentBlocks(article.text, tables),
        repealedBy: null,
        modifiedBy: [],
        addedBy: null,
        number: enforceArticleNumber(numberToUse),
        suffix: suffixToUse || 0
    };
}
