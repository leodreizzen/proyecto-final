import {
    ArticleCreateWithoutResolutionInput,
    ArticleFormalityCreateWithoutArticleInput,
    ArticleModifierCreateWithoutArticleInput,
    ArticleNormativeCreateWithoutArticleInput,
    ContentBlockCreateWithoutArticleInput
} from "@repo/db/prisma/models";
import {changeCreationInput} from "@/data/save-resolution/changes";
import * as Parser from "@/parser/types";
import {suffixToNumber} from "@/data/save-resolution/util";
import {textReferencesCreationInput} from "@/data/save-resolution/references";

type GeneralArticle = (({ standalone: true } & Parser.StandaloneArticle) | ({ standalone: false } & Parser.NewArticle)) & {
    type: Exclude<Parser.Article["type"], "CreateDocument">;
};

export function articleCreationInput(article: GeneralArticle): ArticleCreateWithoutResolutionInput {
    const concreteArticleFields = concreateArticleCreationFields(article);
    
    // StandaloneArticle has 'content'. NewArticle has 'content' if it was assembled.
    const content = article.content!;

    return {
        ...(article.standalone ? {
            number: article.number,
            suffix: suffixToNumber(article.suffix),
        } : {
            number: null,
            suffix: null,
        }),
        content: {
            create: content.map((block, i) => contentBlockCreationInput(block, i + 1))
        },
        ...concreteArticleFields
    } satisfies ArticleCreateWithoutResolutionInput
}

export function contentBlockCreationInput(block: Parser.ContentBlock, order: number): ContentBlockCreateWithoutArticleInput {
    if (block.type === "TEXT") {
        return {
            type: "TEXT",
            text: block.text,
            order,
            references: {
                create: textReferencesCreationInput(block.references)
            }
        };
    } else {
        return {
            type: "TABLE",
            tableContent: block.tableContent,
            order,
        };
    }
}

function concreateArticleCreationFields(article: GeneralArticle): Pick<ArticleCreateWithoutResolutionInput, "type" | "articleNormative" | "articleModifier" | "articleFormality"> {
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

function articleModifierCreationInput(article: Extract<GeneralArticle, {
    type: "Modifier"
}>): ArticleModifierCreateWithoutArticleInput {
    return {
        changes: {
            create: article.changes.map(change => changeCreationInput(change))
        }
    }
}