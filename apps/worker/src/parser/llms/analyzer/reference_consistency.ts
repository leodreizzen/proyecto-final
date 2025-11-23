import {MainResolutionAnalysis} from "@/parser/schemas/analyzer/resolution/resolution";
import {AnnexAnalysis} from "@/parser/schemas/analyzer/annexes/annex";
import {RawReference, ResolutionReferencesAnalysis} from "@/parser/schemas/references/schemas";
import {ResultVoid} from "@/definitions";
import {Change} from "@/parser/schemas/analyzer/change";
import {ArticleAnalysis} from "@/parser/schemas/analyzer/article";
import {isEqual} from "lodash-es";

export function validateReferenceConsistency(mainResolutionAnalysis: MainResolutionAnalysis, annexesAnalysis: AnnexAnalysis[], referencesAnalysis: ResolutionReferencesAnalysis): ResultVoid<string> {
    for (const [index, articleRefs] of referencesAnalysis.articles.entries()) {
        const articleAnalysis = mainResolutionAnalysis.articles[index]!;
        const res = validateReferenceConsistencyInArticle(articleAnalysis, articleRefs.references.map(r => r.reference));
        if (!res.success) {
            return {
                success: false,
                error: `In article index ${index}: ${res.error}`
            }
        }
    }
    for (const [annexIndex, annexRefs] of referencesAnalysis.annexes.entries()) {
        const annexAnalysis = annexesAnalysis[annexIndex]!;
        if (annexRefs.type == "WithArticles" && annexAnalysis.type == "WithArticles") {
            for (const [articleIndex, articleRefs] of annexRefs.articles.entries()) {
                const articleAnalysis = annexAnalysis.articles[articleIndex]!;
                const res = validateReferenceConsistencyInArticle(articleAnalysis, articleRefs.references.map(r => r.reference));
                if (!res.success) {
                    return {
                        success: false,
                        error: `In annex index ${annexIndex}, article index ${articleIndex}: ${res.error}`
                    }
                }
            }
            for (const [chapterIndex, chapterRefs] of annexRefs.chapters.entries()) {
                const chapterAnalysis = annexAnalysis.chapters[chapterIndex]!;
                for (const [articleIndex, articleRefs] of chapterRefs.articles.entries()) {
                    const articleAnalysis = chapterAnalysis.articles[articleIndex]!;
                    const res = validateReferenceConsistencyInArticle(articleAnalysis, articleRefs.references.map(r => r.reference));
                    if (!res.success) {
                        return {
                            success: false,
                            error: `In annex index ${annexIndex}, chapter index ${chapterIndex}, article index ${articleIndex}: ${res.error}`
                        }
                    }
                }
            }
        }
    }
    return {
        success: true
    }
}

function validateReferenceConsistencyInArticle(article: ArticleAnalysis, articleRefs: RawReference[]): ResultVoid<string> {
    if (article.type == "Modifier") {
        const changeRefs = article.changes.flatMap(change => changeReferences(change));
        for (const ref of changeRefs) {
            if (!articleRefs.find(r => isEqual(r, ref))) {
                return {
                    success: false,
                    error: `Reference ${JSON.stringify(ref)} from changes not found in article references`
                }
            }
        }
    }
    return {
        success: true
    }
}

function changeReferences(change: Change): RawReference[] {
    switch (change.type) {
        case "RepealResolution":
            return [{
                referenceType: "Resolution",
                resolutionId: change.targetResolution,
                isDocument: false
            }]
        case "AddArticleToResolution": {
            if (change.newArticleNumber)
                return [{
                    referenceType: "NormalArticle",
                    isDocument: change.targetIsDocument,
                    resolutionId: change.targetResolution,
                    articleNumber: change.newArticleNumber,
                    suffix: change.newArticleSuffix
                }]
            else
                return [{
                    referenceType: "Resolution",
                    resolutionId: change.targetResolution,
                    isDocument: change.targetIsDocument
                }];
        }
        case "ReplaceArticle":
        case "RepealArticle":
        case "ModifyArticle":
            return [change.targetArticle]
        case "ModifyTextAnnex":
        case "RepealAnnex":
            return [change.targetAnnex]
        case "RepealAnnexChapter":
            return [change.targetChapter]
        case "AddAnnexToResolution": {
            let annexSlotRef;
            if (change.newAnnexNumber)
                annexSlotRef = {
                    referenceType: "Annex",
                    resolutionId: change.targetResolution,
                    annexNumber: change.newAnnexNumber,
                } as const
            else
                annexSlotRef = {
                    referenceType: "Resolution",
                    resolutionId: change.targetResolution,
                    isDocument: change.targetIsDocument
                } as const

            return [annexSlotRef, change.annexToAdd]
        }

        case "ReplaceAnnex": {
            const targets: RawReference[] = [change.targetAnnex];
            if (change.newContent.contentType == "Reference") {
                targets.push(change.newContent.reference);
            }
            return targets;
        }
        case "AddAnnexToAnnex":
            return [change.annexToAdd, change.target]
        case "AddArticleToAnnex":{
            if (change.newArticleNumber) {
                if (change.target.referenceType === "Annex") {
                    return [{
                        referenceType: "AnnexArticle",
                        annex: change.target,
                        articleNumber: change.newArticleNumber,
                        suffix: change.newArticleSuffix,
                        chapterNumber: null
                    }]
                } else {
                    return [{
                        referenceType: "AnnexArticle",
                        annex: change.target.annex,
                        articleNumber: change.newArticleNumber,
                        suffix: change.newArticleSuffix,
                        chapterNumber: change.target.chapterNumber
                    }]
                }
            }
            else
                return [change.target]
        }
        case "ApplyModificationsAnnex":
            return [change.annexToApply]
        case "AdvancedChange": {
            return [change.target];
        }
        case "RatifyAdReferendum":
            return [{
                referenceType: "Resolution",
                resolutionId: change.resolutionToRatify,
                isDocument: false
            }];
        default: {
            const _: never = change;
            return [];
        }
    }
}
