import {
    ResolutionStructure
} from "@/parser/schemas/structure_parser/schemas";
import {ArticleAnalysis, ArticleSchemaWithText} from "@/parser/schemas/analyzer/article";
import {AnnexAnalysis, AnnexRegulationAnalysis, TextAnnexAnalysis} from "@/parser/schemas/analyzer/annexes/annex";
import {ResolutionAnalysis} from "@/parser/schemas/analyzer/resolution/resolution";
import {Change, ChangeAddArticleToAnnex, ChangeAddArticleToResolution} from "@/parser/schemas/analyzer/change";
import {ResolutionReferencesAnalysis, TextReference} from "@/parser/schemas/references/schemas";
import {TableAnalysis} from "@/parser/schemas/analyzer/tables/table";
import {annex, ChapterStructure, TextAnnexStructure} from "@/parser/schemas/structure_parser/annex";
import {ArticleStructure} from "@/parser/schemas/structure_parser/article";
import {TableStructure} from "@/parser/schemas/structure_parser/table";


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
type TextAnnexWithoutTables = TextAnnexStructure & TextAnnexAnalysis
type AnnexRegulationWithoutTables = annex & AnnexRegulationAnalysis

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