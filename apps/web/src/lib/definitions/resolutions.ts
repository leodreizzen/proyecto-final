import { Resolution } from "@repo/db/prisma/client";

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

export type resolutionStatus = "ok" | "failedTask"

export interface ResolutionWithStatus extends Resolution {
    status: resolutionStatus;
}

export type ResolutionCounts = {
    total: number;
    missingRef: number;
    failedTasks: number;
}

export type MissingResolution = {
    initial: string;
    number: number;
    year: number;
    referencesCount: number;
}
