import {fetchResolutionDataToShow, ResolutionDBDataToShow} from "@/lib/data/resolutions";
import {
    AnnexToShow,
    ArticleToShow,
    ConsiderationToShow, RecitalToShow,
    ResolutionIDToShow,
    ResolutionToShow,
    TableToShow
} from "@/lib/definitions/resolutions";
import {notFound} from "next/navigation";
import {assign} from "@/lib/utils";
import {enforceAnnexNumber, enforceArticleNumber} from "@/lib/assembly/validity/utils/numbers";

export async function getAssembledResolution(resolutionId: string, versionDate: Date | null) {
    const resolution = await fetchResolutionDataToShow(resolutionId);
    if (!resolution) {
        notFound();
    }
    const dataToShow = getInitialDataToShow(resolution);

    // TODO apply changes

    return dataToShow;
}

function getInitialDataToShow(resolution: ResolutionDBDataToShow): ResolutionToShow {
    const id: ResolutionIDToShow = {initial: resolution.initial, number: resolution.number, year: resolution.year};
    const recitals: RecitalToShow[] = resolution.recitals.map(recital => assign(recital, ["tables"], mapTablesToContent(recital.tables)));
    const considerations: ConsiderationToShow[] = resolution.considerations.map(consideration => assign(consideration, ["tables"], mapTablesToContent(consideration.tables)));
    const articles: ArticleToShow[] = resolution.articles.map(articleInitialDataToShow);
    const annexes: AnnexToShow[] = resolution.annexes.map(annex => {
        if (!annex.annexText)
            throw new Error("Annex text information missing for annex with id " + annex.id);
        if (annex.type === "TEXT") {
            return {
                ...annex,
                ...annex.annexText,
                type: "TEXT",
                tables: mapTablesToContent(annex.annexText.tables),
                repealedBy: null,
                modifiedBy: [],
                addedBy: null,
                number: enforceAnnexNumber(annex.number)
            } satisfies AnnexToShow
        } else if (annex.type === "WITH_ARTICLES") {
            if (!annex.annexWithArticles)
                throw new Error("Annex with articles information missing for annex with id " + annex.id);
            return {
                ...annex,
                ...annex.annexWithArticles,
                type: "WithArticles",
                standaloneArticles: annex.annexWithArticles.standaloneArticles.map(articleInitialDataToShow),
                chapters: annex.annexWithArticles.chapters.map(chapter => ({
                    ...chapter,
                    articles: chapter.articles.map(articleInitialDataToShow),
                    addedBy: null,
                    repealedBy: null,
                })),
                addedBy: null,
                repealedBy: null,
                number: enforceAnnexNumber(annex.number)
            } satisfies AnnexToShow
        } else {
            const _exhaustiveCheck: never = annex.type;
            throw new Error("Unknown annex type for annex with id " + annex.id);
        }
    });

    return {
        id,
        recitals,
        considerations,
        articles,
        annexes,
        caseFiles: resolution.caseFiles,
        decisionBy: resolution.decisionBy,
        date: resolution.date,
        repealedBy: null,
        originalFileId: resolution.originalFileId
    }
}

function mapTablesToContent(tables: ResolutionDBDataToShow["articles"][0]["tables"]): TableToShow[] {
    return tables.map(table => table.content)
}

function articleInitialDataToShow(article: ResolutionDBDataToShow["articles"][0]): ArticleToShow {
    return {
        ...article,
        tables: mapTablesToContent(article.tables),
        repealedBy: null,
        modifiedBy: [],
        addedBy: null,
        number: enforceArticleNumber(article.number),
        suffix: article.suffix || 0
    };
}