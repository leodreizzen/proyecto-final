import {
    Reference,
    ReferenceAnnex,
    ReferenceArticle,
    ReferenceChapter,
    ReferenceResolution, TextReference
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

export type TextReferenceWithReference = TextReference & {
    reference: Reference & {
        article: ReferenceArticle | null,
        annex: ReferenceAnnex | null,
        chapter: ReferenceChapter | null,
        resolution: ReferenceResolution | null
    };
}

export type {ReferenceMarker} from "../processing/reference-processor";