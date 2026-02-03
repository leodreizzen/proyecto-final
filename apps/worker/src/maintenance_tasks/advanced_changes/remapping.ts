import {AnnexToShow, ArticleToShow, ResolutionToShow} from "@repo/resolution-assembly/definitions/resolutions";
import {stringifySuffix} from "@/data/save-resolution/util";
import {TextReferenceWithReference} from "@repo/resolution-assembly/definitions/references";
import {TextReference as ParserTextReference} from "@/parser/schemas/references/schemas";
import {checkReference} from "@repo/db/utils/polymorphism/reference";

export function mapResolutionForLLm(resolution: ResolutionToShow) {
    return {
        id: {
            initial: resolution.id.initial,
            number: resolution.id.number,
            year: resolution.id.year
        },
        decisionBy: resolution.decisionBy,
        date: resolution.date.toISOString(),
        considerations: resolution.considerations.map(c => ({
            content: c.content.map(cb => mapContentBlockForLLm(cb)),
        })),
        recitals: resolution.recitals.map(r => ({
            content: r.content.map(cb => mapContentBlockForLLm(cb)),
        })),
        articles: resolution.articles.map(a => mapArticleContentForLLM(a)),
        annexes: resolution.annexes.map(mapAnnexForLLM)
    }
}

export function mapArticleContentForLLM(articleContent: ArticleToShow) {
    return {
        content: articleContent.content.map(mapContentBlockForLLm),
        number: articleContent.index.type === "defined" ? articleContent.index.number : null,
        suffix: articleContent.index.type === "defined" ? stringifySuffix(articleContent.index.suffix) : null,
    }
}

function mapAnnexForLLM(annex: AnnexToShow) {
    if (annex.type === "TEXT") {
        return {
            type: annex.type,
            content: annex.content.map(c => mapContentBlockForLLm(c)),
            number: annex.index.type === "defined" ? annex.index.number : null
        }
    } else if (annex.type === "WITH_ARTICLES") {
        return {
            type: annex.type,
            initialText: annex.initialText,
            finalText: annex.finalText,
            standaloneArticles: annex.standaloneArticles.map(a => mapArticleContentForLLM(a)),
            chapters: annex.chapters.map(chapter => ({
                title: chapter.title,
                number: chapter.number,
                articles: chapter.articles.map(a => mapArticleContentForLLM(a)),
            })),
            number: annex.index.type === "defined" ? annex.index.number : null
        }
    }
}

function mapContentBlockForLLm(contentBlock: ArticleToShow["content"][number]) {
    return {
        type: contentBlock.type,
        ...(contentBlock.type === "TEXT" ? {text: contentBlock.text, references: contentBlock.referenceMarkers} : {}),
        ...(contentBlock.type === "TABLE" ? {tableContent: contentBlock.tableContent} : {})
    }
}

export function mapDBReferenceToParserReference(ref: TextReferenceWithReference): ParserTextReference {
    let reference;
    const refReference = checkReference(ref.reference);
    if (refReference.resolution) {
        reference = {
            referenceType: "Resolution" as const,
            resolutionId: {
                initial: refReference.resolution.initial,
                number: refReference.resolution.number,
                year: refReference.resolution.year
            },
            isDocument: false
        } satisfies ParserTextReference["reference"]
    } else if (refReference.annex) {
        reference = {
            referenceType: "Annex" as const,
            resolutionId: {
                initial: refReference.annex.initial,
                number: refReference.annex.resNumber,
                year: refReference.annex.year
            },
            annexNumber: refReference.annex.annexNumber,
        } satisfies ParserTextReference["reference"]
    } else if (refReference.chapter) {
        reference = {
            referenceType: "Chapter" as const,
            annex: {
                referenceType: "Annex",
                resolutionId: {
                    initial: refReference.chapter.initial,
                    number: refReference.chapter.resNumber,
                    year: refReference.chapter.year
                },
                annexNumber: refReference.chapter.annexNumber,
            },
            chapterNumber: refReference.chapter.chapterNumber,
        } satisfies ParserTextReference["reference"]
    } else if (refReference.article) {
        const articleRef = refReference.article;
        if (articleRef.annexNumber === null) {
            reference = {
                referenceType: "NormalArticle" as const,
                resolutionId: {
                    initial: articleRef.initial,
                    number: articleRef.resNumber,
                    year: articleRef.year
                },
                articleNumber: articleRef.articleNumber,
                isDocument: false,
                suffix: stringifySuffix(articleRef.articleSuffix),
            } satisfies ParserTextReference["reference"]
        } else {
            reference = {
                referenceType: "AnnexArticle" as const,
                annex: {
                    referenceType: "Annex",
                    resolutionId: {
                        initial: articleRef.initial,
                        number: articleRef.resNumber,
                        year: articleRef.year
                    },
                    annexNumber: articleRef.annexNumber,
                },
                chapterNumber: articleRef.chapterNumber ?? null,
                articleNumber: articleRef.articleNumber,
                suffix: stringifySuffix(articleRef.articleSuffix),
            } satisfies ParserTextReference["reference"]
        }
    } else {
        const _exhaustiveCheck: never = refReference;
        throw new Error("Unknown reference type in DB reference.");
    }

    return {
        before: ref.textBefore,
        after: ref.textAfter,
        text: ref.text,
        reference
    } satisfies ParserTextReference;
}