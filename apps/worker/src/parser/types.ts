import {
    ResolutionStructure
} from "@/parser/schemas/structure_parser/schemas";
import {AnnexAnalysis} from "@/parser/schemas/analyzer/annexes/annex";
import {MainResolutionAnalysis} from "@/parser/schemas/analyzer/resolution/resolution";
import {
    Change as ChangeAnalysis, ChangeAddArticleToAnnex, ChangeAddArticleToResolution,
    ChangeReplaceAnnex, ChangeReplaceArticle, ReplaceAnnexNewContent,
} from "@/parser/schemas/analyzer/change";
import {
    RawReference,
    RawResolutionReference,
    ResolutionReferencesAnalysis,
} from "@/parser/schemas/references/schemas";
import {TableAnalysis} from "@/parser/schemas/analyzer/tables/table";
import {AnnexWithArticlesStructure, TextAnnexStructure} from "@/parser/schemas/structure_parser/annex";
import {ArticleStructure} from "@/parser/schemas/structure_parser/article";
import {TableStructure} from "@/parser/schemas/structure_parser/table";
import {TextReference} from "@/parser/schemas/references/schemas";
import {ContentBlockType} from "@repo/db/prisma/client";
import {TableContent} from "@repo/db/content-blocks";


//eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;


export type ParseResolutionError = {
    code: "invalid_format"
    message: string;
} | {
    code: "too_large"
};


export type ContentBlock = ({
    type: typeof ContentBlockType.TEXT;
    text: string;
} | {
    type: typeof ContentBlockType.TABLE;
    tableContent: TableContent;
}) & {
    references: TextReference[];
};

export type WithContentBlocks<T> = DistributiveOmit<T, "text" | "tables" | "references"> & { content: ContentBlock[] };

export type Reference =
    Exclude<RawReference, { referenceType: "Resolution" }>
    | Omit<RawResolutionReference, "isDocument">;

type FullArticleAnalysis = FullResolutionAnalysis["articles"][number];
type FullAnnexAnalysis = FullResolutionAnalysis["annexes"][number];
type FullTextAnnexAnalysis = Extract<FullAnnexAnalysis, { type: "TextOrTables" }>;
type FullAnnexWithArticlesAnalysis = Extract<FullAnnexAnalysis, { type: "WithArticles" }>;

export type ArticleWithoutTables = ArticleStructure & FullArticleAnalysis;

type ChangeAddArticleToResolutionMapped = Omit<ChangeAddArticleToResolution, "articleToAdd"> & {
    articleToAdd: NewArticle
}

type ChangeAddArticleToAnnexMapped = Omit<ChangeAddArticleToAnnex, "articleToAdd"> & {
    articleToAdd: NewArticle
}

type ChangeReplaceArticleMapped = Omit<ChangeReplaceArticle, "newContent"> & {
    newContent: NewArticle
}

type ReplaceAnnexNewContentMapped = Exclude<ReplaceAnnexNewContent, { contentType: "Inline" }> | (
    Omit<Extract<ReplaceAnnexNewContent, { contentType: "Inline" }>, "content"> & {
    content: NewAnnex
})

type ChangeReplaceAnnexMapped = Omit<ChangeReplaceAnnex, "newContent"> & {
    newContent: ReplaceAnnexNewContentMapped
}

type ChangeModifyArticleMapped = Omit<Extract<ChangeAnalysis, { type: "ModifyArticle" }>, "before" | "after"> & {
    before: ContentBlock[],
    after: ContentBlock[]
}

type ChangeModifyTextAnnexMapped = Omit<Extract<ChangeAnalysis, { type: "ModifyTextAnnex" }>, "before" | "after"> & {
    before: ContentBlock[],
    after: ContentBlock[]
}

export type ChangeMapped = (Exclude<ChangeAnalysis, {
    type: "AddArticleToResolution" | "AddArticleToAnnex" | "ReplaceArticle" | "ModifyArticle" | "ModifyTextAnnex" | "ReplaceAnnex"
}> | ChangeAddArticleToResolutionMapped | ChangeAddArticleToAnnexMapped | ChangeReplaceArticleMapped | ChangeReplaceAnnexMapped | ChangeModifyArticleMapped | ChangeModifyTextAnnexMapped);


type ArticleModifier = Extract<ArticleStructure & FullArticleAnalysis, { type: "Modifier" }>;

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
export type TextAnnexWithoutTables = TextAnnexStructure & FullTextAnnexAnalysis
export type AnnexWithArticlesWithoutTables =
    Omit<AnnexWithArticlesStructure & FullAnnexWithArticlesAnalysis, "articles" | "chapters">
    & {
    articles: (AnnexWithArticlesStructure["articles"][number] & FullAnnexWithArticlesAnalysis["articles"][number])[];
    chapters: (Omit<AnnexWithArticlesStructure["chapters"][number] & FullAnnexWithArticlesAnalysis["chapters"][number], "articles"> & {
        articles: (AnnexWithArticlesStructure["chapters"][number]["articles"][number] & FullAnnexWithArticlesAnalysis["chapters"][number]["articles"][number])[]
    })[]
}

type AnnexArticleModifier = Extract<AnnexWithArticlesWithoutTables["articles"][number], { type: "Modifier" }>;
type AnnexArticleModifierWithMappedChanges = Omit<AnnexArticleModifier, "changes"> & {
    changes: ChangeMapped[];
}

type AnnexArticleWithMappedChanges =
    Exclude<AnnexWithArticlesWithoutTables["articles"][number], { type: "Modifier" }>
    | AnnexArticleModifierWithMappedChanges;

type AnnexWithArticlesWithMappedChanges = Omit<AnnexWithArticlesWithoutTables, "articles" | "chapters"> & {
    articles: AnnexArticleWithMappedChanges[];
    chapters: (Omit<AnnexWithArticlesWithoutTables["chapters"][number], "articles"> & {
        articles: AnnexArticleWithMappedChanges[];
    })[]
}

// An article that is created by a change (ej. articleToAdd)
export type NewArticle = DistributiveOmit<Article, "number" | "suffix">;

export type NewAnnex = DistributiveOmit<StandaloneAnnex, "number">;

export type Article = DistributiveOmit<ArticleWithMappedChanges, "text" | "tables" | "references"> & {
    content: ContentBlock[]
};

export type StandaloneArticle = Article;


export type AnnexWithoutTables = TextAnnexWithoutTables | AnnexWithArticlesWithoutTables;
export type NewTextAnnexWithoutTables = DistributiveOmit<TextAnnexWithoutTables, "number" | "tables">;
export type NewAnnexWithArticlesWithoutTables = DistributiveOmit<AnnexWithArticlesWithoutTables, "number">;
export type NewAnnexWithoutTables = NewTextAnnexWithoutTables | NewAnnexWithArticlesWithoutTables;


export type StandaloneTextAnnex = WithContentBlocks<Omit<TextAnnexWithoutTables, "content">>
export type NewTextAnnex = WithContentBlocks<Omit<NewTextAnnexWithoutTables, "content">>;

export type StandaloneAnnex =
    StandaloneTextAnnex
    | (Omit<AnnexWithArticlesWithMappedChanges, "articles" | "chapters"> & {
    articles: Article[];
    chapters: (Omit<AnnexWithArticlesWithMappedChanges["chapters"][number], "articles"> & {
        articles: Article[]
    })[]
});

export type Recital = WithContentBlocks<RecitalWithoutTables>;
export type Consideration = WithContentBlocks<ConsiderationWithoutTables>

export type Change = ChangeMapped;
export type Chapter = Extract<StandaloneAnnex, { type: "WithArticles" }>["chapters"][number];
export type Table = TableStructure;


export type Resolution =
    Omit<ResolutionStructure & FullResolutionAnalysis, "tables" | "recitals" | "considerations" | "annexes" | "articles">
    & {
    recitals: Recital[]
    considerations: Consideration[]
    articles: Article[],
    annexes: StandaloneAnnex[]
}

export type {ReplaceAnnexContent} from "@/parser/schemas/analyzer/change";
export type {TextReference}
