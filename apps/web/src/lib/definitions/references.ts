import {
    Reference,
    ReferenceAnnex,
    ReferenceArticle,
    ReferenceChapter,
    ReferenceResolution
} from "@repo/db/prisma/client";

export type ReferenceWithConcreteWithoutPayload = Omit<Reference, "id" | "sourceType"> & ({
    targetType: "RESOLUTION",
    resolution: Omit<ReferenceResolution, "resolutionId" | "id">
} | {
    targetType: "ARTICLE",
    article: Omit<ReferenceArticle, "articleId" | "id">
} | {
    targetType: "ANNEX",
    annex: Omit<ReferenceAnnex, "annexId" | "id">
} | {
    targetType: "CHAPTER",
    chapter: Omit<ReferenceChapter, "chapterId" | "id">
})