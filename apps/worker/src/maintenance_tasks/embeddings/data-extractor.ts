import {
    AnnexToShow,
    ArticleToShow,
    ConsiderationToShow,
    RecitalToShow,
    ResolutionToShow
} from "@repo/resolution-assembly/definitions/resolutions";
import { ArticleLocation, DataToEmbed, IndexedBlock } from "./definitions";
import { buildReferenceMap } from "./helpers/references";
import { getContextForEmbedding } from "./context-generator";
import { splitContentInChunks } from "./helpers/chunking";

export function getDataToEmbed(resolutionData: ResolutionToShow): DataToEmbed[] {
    const referenceMap = buildReferenceMap(resolutionData);

    const dataToEmbed: DataToEmbed[] = [];

    const recitalsData = resolutionData.recitals.map(recital => getRecitalDataToEmbed(recital, resolutionData, referenceMap));
    const considerationsData = resolutionData.considerations.map(consideration => getConsiderationDataToEmbed(consideration, resolutionData, referenceMap));
    const articlesData = resolutionData.articles.flatMap(article => getArticleDataToEmbed(article, resolutionData, referenceMap, {
        chapterNumber: null,
        annexIndex: null
    }));
    const annexesData = resolutionData.annexes.flatMap((annex => getAnnexDataToEmbed(annex, resolutionData, referenceMap)));

    dataToEmbed.push(...recitalsData, ...considerationsData, ...articlesData, ...annexesData);
    return dataToEmbed;
}

function getRecitalDataToEmbed(recital: RecitalToShow, resolutionData: ResolutionToShow, referenceMap: Map<string, IndexedBlock[]>): DataToEmbed {
    const context = getContextForEmbedding(resolutionData, referenceMap, { type: "RECITAL", recital });
    return {
        type: "RECITAL",
        number: recital.number,
        chunks: splitContentInChunks(context, recital.content)
    };
}

function getConsiderationDataToEmbed(consideration: ConsiderationToShow, resolutionData: ResolutionToShow, referenceMap: Map<string, IndexedBlock[]>): DataToEmbed {
    const context = getContextForEmbedding(resolutionData, referenceMap, { type: "CONSIDERATION", consideration });

    return {
        type: "CONSIDERATION",
        number: consideration.number,
        chunks: splitContentInChunks(context, consideration.content)
    };
}

function getArticleDataToEmbed(article: ArticleToShow, resolutionData: ResolutionToShow, referenceMap: Map<string, IndexedBlock[]>, location: Omit<ArticleLocation, "articleIndex">): DataToEmbed {
    const context = getContextForEmbedding(resolutionData, referenceMap, { type: "ARTICLE", article, location });

    const articleIndex = article.index;

    return {
        type: "ARTICLE",
        location: { ...location, articleIndex },
        chunks: splitContentInChunks(context, article.content)
    }
}

function getAnnexDataToEmbed(annex: AnnexToShow, resolutionData: ResolutionToShow, referenceMap: Map<string, IndexedBlock[]>): DataToEmbed[] {
    if (annex.type == "TEXT") {
        return getTextAnnexDataToEmbed(annex, resolutionData, referenceMap);
    } else {
        return getAnnexWithArticlesDataToEmbed(annex, resolutionData, referenceMap);
    }
}

function getTextAnnexDataToEmbed(annex: AnnexToShow & {
    type: "TEXT"
}, resolutionData: ResolutionToShow, referenceMap: Map<string, IndexedBlock[]>): DataToEmbed[] {
    const context = getContextForEmbedding(resolutionData, referenceMap, { type: "TEXT_ANNEX", annex });
    return [{
        type: "TEXT_ANNEX",
        annexIndex: annex.index,
        chunks: splitContentInChunks(context, annex.content)
    }]
}

function getAnnexWithArticlesDataToEmbed(annex: AnnexToShow & {
    type: "WITH_ARTICLES"
}, resolutionData: ResolutionToShow, referenceMap: Map<string, IndexedBlock[]>): DataToEmbed[] {
    const dataToEmbed: DataToEmbed[] = [];
    for (const article of annex.standaloneArticles) {
        const articleData = getArticleDataToEmbed(article, resolutionData, referenceMap, {
            chapterNumber: null,
            annexIndex: annex.index
        });
        dataToEmbed.push(articleData);
    }
    for (const chapter of annex.chapters) {
        for (const article of chapter.articles) {
            const articleData = getArticleDataToEmbed(article, resolutionData, referenceMap, {
                chapterNumber: chapter.number,
                annexIndex: annex.index
            });
            dataToEmbed.push(articleData);
        }
    }
    return dataToEmbed;
}
