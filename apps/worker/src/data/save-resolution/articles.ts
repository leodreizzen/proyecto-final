import {
    ArticleCreateDocumentCreateWithoutArticleInput,
    ArticleCreateWithoutResolutionInput,
    ArticleFormalityCreateWithoutArticleInput,
    ArticleModifierCreateWithoutArticleInput,
    ArticleNormativeCreateWithoutArticleInput
} from "@repo/db/prisma/models";
import {changeCreationInput} from "@/data/save-resolution/changes";
import * as Parser from "@/parser/types";
import {suffixToNumber} from "@/data/save-resolution/util";
import {annexReferenceCreateInput} from "@/data/save-resolution/references";
import {parseToContentBlockInputs, withOrder} from "@/data/save-resolution/block-parser";

type GeneralArticle = ({ standalone: true } & Parser.StandaloneArticle) | ({ standalone: false } & Parser.NewArticle);

export function articleCreationInput(article: GeneralArticle): ArticleCreateWithoutResolutionInput {
    const concreteArticleFields = concreateArticleCreationFields(article);
    
    // In Parser.types, NewArticle is Article omitted of number, suffix, tables, references.
    // So we need to handle that.
    const tables = 'tables' in article ? article.tables : [];
    const references = 'references' in article ? article.references : [];

    const contentBlocks = parseToContentBlockInputs(article.text, tables, references);

    return {
        ...(article.standalone ? {
            number: article.number,
            suffix: suffixToNumber(article.suffix),
        } : {
            number: null,
            suffix: null,
        }),
        content: {
            create: withOrder(contentBlocks)
        },
        ...concreteArticleFields
    } satisfies ArticleCreateWithoutResolutionInput
}

function concreateArticleCreationFields(article: GeneralArticle): Pick<ArticleCreateWithoutResolutionInput, "type" | "articleNormative" | "articleModifier" | "articleCreateDocument" | "articleFormality"> {
    switch (article.type) {
        case "Normative":
            return {
                type: "NORMATIVE",
                articleNormative: articleNormativeCreationInput(article),
            };
        case "Formality":
            return {
                type: "FORMALITY",
                articleFormality: {
                    create: articleFormalityCreationInput(article)
                }
            };
        case "CreateDocument":
            return {
                type: "CREATE_DOCUMENT",
                articleCreateDocument: {
                    create: articleCreateDocumentCreationInput(article)
                }
            };
        case "Modifier":
            return {
                type: "MODIFIER",
                articleModifier: {
                    create: articleModifierCreationInput(article)
                }
            };
        default: {
            const _exhaustiveCheck: never = article;
            throw new Error(`Unhandled article type: ${JSON.stringify(article["type"])}`);
        }
    }
}

function articleNormativeCreationInput(_article: Extract<GeneralArticle, {
    type: "Normative"
}>): ArticleNormativeCreateWithoutArticleInput {
    return {}
}

function articleFormalityCreationInput(_article: Extract<GeneralArticle, {
    type: "Formality"
}>): ArticleFormalityCreateWithoutArticleInput {
    return {}
}

function articleCreateDocumentCreationInput(article: Extract<GeneralArticle, {
    type: "CreateDocument"
}>): ArticleCreateDocumentCreateWithoutArticleInput {
    return {
        annexToApprove: {
            create: annexReferenceCreateInput(article.annexToApprove, "ARTICLE_CREATE_DOCUMENT")
        }
    }
}

function articleModifierCreationInput(article: Extract<GeneralArticle, {
    type: "Modifier"
}>): ArticleModifierCreateWithoutArticleInput {
    return {
        changes: {
            create: article.changes.map(change => changeCreationInput(change))
        }
    }
}


