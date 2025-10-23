import {
    AnnexRegulationStructure,
    ArticleStructure,
    ChapterStructure, ResolutionStructure,
    TableStructure,
    TextAnnexStructure
} from "@/parser/schemas/parser/schemas";
import {ArticleAnalysis, ArticleSchemaWithText} from "@/parser/schemas/analyzer/article";
import {TextReference} from "@/parser/schemas/analyzer/reference";
import {AnnexAnalysis, AnnexRegulationAnalysis, TextAnnexAnalysis} from "@/parser/schemas/analyzer/annex";
import {ResolutionAnalysis} from "@/parser/schemas/analyzer/resolution";
import {Change, ChangeAddArticleToAnnex, ChangeAddArticleToResolution} from "@/parser/schemas/analyzer/change";


export type WithTables<T> = T & {
    tables: TableStructure[];
}

export type ArticleWithoutTables = ArticleStructure & ArticleAnalysis;

type ArticleSchemaWithTextMapped = Omit<ArticleSchemaWithText, "analysis"> & ArticleSchemaWithText["analysis"]

type ChangeAddArticleToResolutionMapped = Omit<ChangeAddArticleToResolution, "articleToAdd"> & {
    articleToAdd: ArticleSchemaWithTextMapped
}

type ChangeAddArticleToAnnexMapped = Omit<ChangeAddArticleToAnnex, "articleToAdd"> & {
    articleToAdd: ArticleSchemaWithTextMapped
}


type ChangeMapped = Exclude<Change, {
    type: "AddArticleToResolution" | "AddArticleToAnnex"
}> | ChangeAddArticleToResolutionMapped | ChangeAddArticleToAnnexMapped;

type ArticleModifier = Extract<ArticleStructure & ArticleAnalysis, {type: "Modifier"}>;

type ArticleModifierWithMappedChanges = Omit<ArticleModifier, "changes"> & {
    changes: ChangeMapped[];
}

type ArticleWithMappedChanges = Exclude<ArticleWithoutTables, { type: "Modifier" }> | ArticleModifierWithMappedChanges;

export type FullResolutionAnalysis = ResolutionAnalysis & {
    annexes: AnnexAnalysis[];
}

export type RecitalWithoutTables = {
    text: string,
    references: TextReference[];
}
export type ConsiderationWithoutTables = {
    text: string,
    references: TextReference[];
}
type TextAnnexWithoutTables = TextAnnexStructure & TextAnnexAnalysis
type AnnexRegulationWithoutTables = AnnexRegulationStructure & AnnexRegulationAnalysis

type TextAnnex = WithTables<TextAnnexWithoutTables>
type AnnexRegulation = AnnexRegulationAnalysis & {
    articles: WithTables<AnnexRegulationAnalysis["articles"][number]>[];
    chapters: (ChapterStructure & {
        articles: WithTables<AnnexRegulationAnalysis["chapters"][number]["articles"][number]>[]
    })[];
};


export type AnnexWithoutTables = TextAnnexWithoutTables | AnnexRegulationWithoutTables;

export type Annex = TextAnnex | AnnexRegulation;
export type Article = WithTables<ArticleWithMappedChanges>;
export type Recital = WithTables<RecitalWithoutTables>;
export type Consideration = WithTables<ConsiderationWithoutTables>;

export type Resolution = Omit<ResolutionStructure & FullResolutionAnalysis, "tables" | "recitals" | "considerations" | "annexes" | "articles" > & {
    recitals: Recital[]
    considerations: Consideration[]
    articles: Article[],
    annexes: Annex[]
}