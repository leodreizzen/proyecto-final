import {getChangesForValidityGraph} from "@/lib/data/changes/validity-graph";

export type ChangeForGraph = Awaited<ReturnType<typeof getChangesForValidityGraph>>[number];
export type ArticleForGraph = ChangeForGraph["articleModifier"]["article"];
export type AnnexForGraph = NonNullable<ArticleForGraph["annex"]>["annex"];
export type ResolutionForGraph = NonNullable<ArticleForGraph["resolution"]>;
export type ChapterForGraph = NonNullable<ArticleForGraph["chapter"]>;
export type Reference = NonNullable<ChangeForGraph["changeRepeal"]>["target"];
export type ResolutionReference = NonNullable<Reference["resolution"]>
export type ArticleReference = NonNullable<Reference["article"]>;
export type AnnexReference = NonNullable<Reference["annex"]>;
export type ChapterReference = NonNullable<Reference["chapter"]>;
export type NewArticle = NonNullable<NonNullable<ChangeForGraph["changeAddArticle"]>["newArticle"]>;
export type NewAnnex = NonNullable<NonNullable<ChangeForGraph["changeReplaceAnnex"]>["newInlineAnnex"]>;
export type ObjectForGraph =
    | { type: "resolution", object: ResolutionForGraph }
    | { type: "article", object: ArticleForGraph }
    | { type: "annex", object: AnnexForGraph }
    | { type: "chapter", object: ChapterForGraph }


export type ValidReference = Reference & ({
    targetType: "RESOLUTION",
    resolution: ResolutionReference,
} | {
    targetType: "ARTICLE",
    article: ArticleReference,
} | {
    targetType: "ANNEX",
    annex: AnnexReference,
} | {
    targetType: "CHAPTER",
    chapter: ChapterReference,
});