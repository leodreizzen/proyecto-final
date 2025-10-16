import {
    AnnexModificationsStructure,
    AnnexRegulationStructure,
    ArticleStructure,
    ChapterStructure, ResolutionStructure,
    TableStructure,
    TextAnnexStructure
} from "@/parser/schemas/parser/schemas";
import {ArticleAnalysis} from "@/parser/schemas/analyzer/article";
import {TextReference} from "@/parser/schemas/analyzer/reference";
import {AnnexRegulationAnalysis, AnnexModificationsAnalysis, TextAnnexAnalysis} from "@/parser/schemas/analyzer/annex";
import {ResolutionAnalysis} from "@/parser/schemas/analyzer/resolution";

export type WithTables<T> = T & {
    tables: TableStructure[];
}

type ArticleWithoutTables = ArticleStructure & ArticleAnalysis;
type RecitalWithoutTables = {
    text: string,
    references: TextReference[];
}
type ConsiderationWithoutTables = {
    text: string,
    references: TextReference[];
}
type TextAnnexWithoutTables = TextAnnexStructure & TextAnnexAnalysis
type AnnexRegulationWithoutTables = AnnexRegulationStructure & AnnexRegulationAnalysis
type AnnexModificationsWithoutTables = AnnexModificationsStructure & AnnexModificationsAnalysis


type TextAnnex = WithTables<TextAnnexWithoutTables>
type AnnexRegulation = AnnexRegulationAnalysis & {
    looseArticles: WithTables<AnnexRegulationAnalysis["looseArticles"][number]>[];
    chapters: (ChapterStructure & {
        articles: WithTables<AnnexRegulationAnalysis["chapters"][number]["articles"][number]>[]
    })[];
};

export type AnnexModifications = AnnexModificationsWithoutTables & {
    articles: WithTables<AnnexModificationsWithoutTables["articles"][number]>[];
};

export type AnnexWithoutTables = TextAnnexWithoutTables | AnnexRegulationWithoutTables | AnnexModificationsWithoutTables;


export type Annex = TextAnnex | AnnexRegulation | AnnexModifications;
export type Article = WithTables<ArticleWithoutTables>;
export type Recital = WithTables<RecitalWithoutTables>;
export type Consideration = WithTables<ConsiderationWithoutTables>;

export type Resolution = Omit<ResolutionStructure & ResolutionAnalysis, "tables" | "recitals" | "considerations" | "annexes" > & {
    recitals: Recital[]
    considerations: Consideration[]
    articles: Article[],
    annexes: Annex[]
}