import {
    ResolutionStructure
} from "@/parser/schemas/structure_parser/schemas";
import {ArticleSchemaWithText} from "@/parser/schemas/analyzer/article";
import {AnnexAnalysis} from "@/parser/schemas/analyzer/annexes/annex";
import {MainResolutionAnalysis} from "@/parser/schemas/analyzer/resolution/resolution";
import {Change, ChangeAddArticleToAnnex, ChangeAddArticleToResolution} from "@/parser/schemas/analyzer/change";
import {
    RawReference,
    RawResolutionReference,
    ResolutionReferencesAnalysis,
    TextReference
} from "@/parser/schemas/references/schemas";
import {TableAnalysis} from "@/parser/schemas/analyzer/tables/table";
import {AnnexWithArticlesStructure, TextAnnexStructure} from "@/parser/schemas/structure_parser/annex";
import {ArticleStructure} from "@/parser/schemas/structure_parser/article";
import {TableStructure} from "@/parser/schemas/structure_parser/table";

export type ParseResolutionError = {
    code: "invalid_format"
    message: string;
} | {
    code: "too_large"
};

export type Reference = Exclude<RawReference, { referenceType: "Resolution" }> | Omit<RawResolutionReference, "isDocument">;

export type WithTables<T> = T & {
    tables: TableStructure[];
}

type FullArticleAnalysis = FullResolutionAnalysis["articles"][number];
type FullAnnexAnalysis = FullResolutionAnalysis["annexes"][number];
type FullTextAnnexAnalysis = Extract<FullAnnexAnalysis, {type: "TextOrTables"}>;
type FullAnnexWithArticlesAnalysis = Extract<FullAnnexAnalysis, {type: "WithArticles"}>;


export type ArticleWithoutTables = ArticleStructure & FullArticleAnalysis;

type ArticleSchemaWithTextMapped = Omit<ArticleSchemaWithText, "analysis"> & ArticleSchemaWithText["analysis"]

type ChangeAddArticleToResolutionMapped = Omit<ChangeAddArticleToResolution, "articleToAdd"> & {
    articleToAdd: ArticleSchemaWithTextMapped
}

type ChangeAddArticleToAnnexMapped = Omit<ChangeAddArticleToAnnex, "articleToAdd"> & {
    articleToAdd: ArticleSchemaWithTextMapped
}

export type ChangeMapped = Exclude<Change, {
    type: "AddArticleToResolution" | "AddArticleToAnnex"
}> | ChangeAddArticleToResolutionMapped | ChangeAddArticleToAnnexMapped;

type ArticleModifier = Extract<ArticleStructure & FullArticleAnalysis, {type: "Modifier"}>;

type ArticleModifierWithMappedChanges = Omit<ArticleModifier, "changes"> & {
    changes: ChangeMapped[];
}

type ArticleWithMappedChanges = Exclude<ArticleWithoutTables, { type: "Modifier" }> | ArticleModifierWithMappedChanges;

export type FullResolutionAnalysis = MainResolutionAnalysis & {
    annexes: AnnexAnalysis[];
    tables: TableAnalysis[];
} & ResolutionReferencesAnalysis;

export type RecitalWithoutTables = {
    text: string,
    references: TextReference[];
}
export type ConsiderationWithoutTables = {
    text: string,
    references: TextReference[];
}
type TextAnnexWithoutTables = TextAnnexStructure & FullTextAnnexAnalysis
type AnnexWithArticlesWithoutTables = Omit<AnnexWithArticlesStructure & FullAnnexWithArticlesAnalysis, "articles" | "chapters"> & {
    articles: (AnnexWithArticlesStructure["articles"][number] & FullAnnexWithArticlesAnalysis["articles"][number] )[];
    chapters: (Omit<AnnexWithArticlesStructure["chapters"][number] & FullAnnexWithArticlesAnalysis["chapters"][number], "articles"> & {
        articles: (AnnexWithArticlesStructure["chapters"][number]["articles"][number] & FullAnnexWithArticlesAnalysis["chapters"][number]["articles"][number])[]
    })[]
}

type AnnexArticleModifier = Extract<AnnexWithArticlesWithoutTables["articles"][number], {type: "Modifier"}>;
type AnnexArticleModifierWithMappedChanges = Omit<AnnexArticleModifier, "changes"> & {
    changes: ChangeMapped[];
}

type AnnexArticleWithMappedChanges = Exclude<AnnexWithArticlesWithoutTables["articles"][number], { type: "Modifier" }> | AnnexArticleModifierWithMappedChanges;

type AnnexWithArticlesWithMappedChanges = Omit<AnnexWithArticlesWithoutTables, "articles" | "chapters"> & {
    articles: AnnexArticleWithMappedChanges[];
    chapters: (Omit<AnnexWithArticlesWithoutTables["chapters"][number], "articles"> & {
        articles: AnnexArticleWithMappedChanges[];
    })[]
}

export type AnnexWithMappedChanges = TextAnnexWithoutTables | AnnexWithArticlesWithMappedChanges;

type TextAnnex = WithTables<TextAnnexWithoutTables>

type AnnexWithArticles = Omit<AnnexWithArticlesWithMappedChanges, "articles" | "chapters"> & {
    articles: WithTables<AnnexWithArticlesWithMappedChanges["articles"][number]>[];
    chapters: (Omit<AnnexWithArticlesWithMappedChanges["chapters"][number], "articles"> & {
        articles: WithTables<AnnexWithArticlesWithMappedChanges["chapters"][number]["articles"][number]>[]
    })[]
}

export type AnnexWithoutTables = TextAnnexWithoutTables | AnnexWithArticlesWithoutTables;

export type Annex = TextAnnex | AnnexWithArticles;
export type Article = WithTables<ArticleWithMappedChanges>;
export type Recital = WithTables<RecitalWithoutTables>;
export type Consideration = WithTables<ConsiderationWithoutTables>;

export type Resolution = Omit<ResolutionStructure & FullResolutionAnalysis, "tables" | "recitals" | "considerations" | "annexes" | "articles" > & {
    recitals: Recital[]
    considerations: Consideration[]
    articles: Article[],
    annexes: Annex[]
}
