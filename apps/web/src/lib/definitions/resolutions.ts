import {Resolution, SearchableContent} from "@repo/db/prisma/client";

export type {
    ResolutionNaturalID,
    TextBlock,
    TableBlock,
    ErrorBlock,
    ContentBlock,
    ArticleIndex,
    AnnexIndex,
    ResolutionToShow,
    ArticleToShow,
    AnnexToShow,
    ChapterToShow,
    ResolutionVersion,
    TableContent
} from "@repo/resolution-assembly/definitions/resolutions";

export type resolutionStatus = "ok" | "failedTask" | "pendingTask"

export interface ResolutionWithStatus extends Resolution {
    status: resolutionStatus;
}

export type ResolutionCounts = {
    total: number;
    missingRef: number;
    failedTasks: number;
    pendingTasks: number;
}

export type MissingResolution = {
    initial: string;
    number: number;
    year: number;
    referencesCount: number;
}

export type SearchableContentWithResolution = SearchableContent & {
    resolution: Pick<Resolution,
        | "id"
        | "initial"
        | "number"
        | "year"
        | "date"
        | "summary"
        | "title"
    >;
}
