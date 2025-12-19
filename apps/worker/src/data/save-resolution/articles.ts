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
import {tablesCreationInput} from "@/data/save-resolution/tables";
import {annexReferenceCreateInput, textReferencesCreationInput} from "@/data/save-resolution/references";

type GeneralArticle = ({ standalone: true } & Parser.StandaloneArticle) | ({ standalone: false } & Parser.NewArticle);

export function articleCreationInput(article: GeneralArticle): ArticleCreateWithoutResolutionInput {
    const concreteArticleFields = concreateArticleCreationFields(article);
    return {
        ...(article.standalone ? {
            number: article.number,
            suffix: (article.standalone) ? suffixToNumber(article.suffix) : null,
            tables: {
                create: tablesCreationInput(article.tables)
            },
            references: {
                create: textReferencesCreationInput(article.references)
            }
        } : {
            number: null,
            suffix: null,
        }),
        text: article.text,
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


