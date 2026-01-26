import * as Parser from "@/parser/types";
import {articleCreationInput, contentBlockCreationInput} from "@/data/save-resolution/articles";
import {
    AnnexCreateWithoutResolutionInput,
    AnnexTextCreateWithoutAnnexInput,
    AnnexWithArticlesCreateWithoutAnnexInput
} from "@repo/db/prisma/models";
import {AnnexType} from "@repo/db/prisma/enums";

type GeneralAnnex = { standalone: true } & Parser.StandaloneAnnex | ({ standalone: false } & Parser.NewAnnex);

export function annexCreationInput(annex: GeneralAnnex): AnnexCreateWithoutResolutionInput {
    let concreteAnnexFields: Partial<AnnexCreateWithoutResolutionInput> & {
        type: AnnexType
    }

    switch (annex.type) {
        case "WithArticles":
            concreteAnnexFields = {
                type: "WITH_ARTICLES",
                annexWithArticles: {
                    create: annexWithArticlesCreationInput(annex)
                }
            }
            break;
        case "TextOrTables":
            concreteAnnexFields = {
                type: "TEXT",
                annexText: {
                    create: annexTextCreationInput(annex)
                }
            }
            break;
        default: {
            const _exhaustiveCheck: never = annex;
            throw new Error(`Unhandled annex type: ${JSON.stringify(annex["type"])}`);
        }
    }

    return {
        number: annex.standalone ? annex.number : null,
        name: annex.name,
        ...concreteAnnexFields
    } satisfies AnnexCreateWithoutResolutionInput
}

function annexWithArticlesCreationInput(annex: Extract<GeneralAnnex, {
    type: "WithArticles"
}>): AnnexWithArticlesCreateWithoutAnnexInput {
    return {
        initialText: annex.initialText,
        finalText: annex.finalText,
        standaloneArticles: {
            create: annex.articles.map(art => articleCreationInput({...art, standalone: true}))
        },
        chapters: {
            create: annex.chapters.map(chapter => chapterCreationInput(chapter))
        }
    }
}

function chapterCreationInput(chapter: Parser.Chapter) {
    return {
        number: chapter.number,
        title: chapter.title,
        articles: {
            create: chapter.articles.map(art => articleCreationInput({...art, standalone: true}))
        }
    }
}

function annexTextCreationInput(annex: Extract<GeneralAnnex, {
    type: "TextOrTables"
}>): AnnexTextCreateWithoutAnnexInput {
    const content = annex.content;
    return {
        content: {
            create: content.map((block, i) => contentBlockCreationInput(block, i + 1))
        }
    }
}