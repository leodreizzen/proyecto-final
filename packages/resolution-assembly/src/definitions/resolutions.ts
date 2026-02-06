import {Resolution} from "@repo/db/prisma/client";
import {TableContent} from "@repo/db/content-blocks";

import {ReferenceMarker} from "../processing/reference-processor";

export type {TableContent};

export type resolutionStatus = "ok" | "missingRef" | "inconsistent"

export interface ResolutionWithStatus extends Resolution {
    status: resolutionStatus;
}

export type ResolutionCounts = {
    total: number;
    missingRef: number;
    inconsistent: number;
}

export type MissingResolution = {
    initial: string;
    number: number;
    year: number;
    referencesCount: number;
}

export type ResolutionNaturalID = {
    initial: string;
    number: number;
    year: number;
}

export type Repealable = {
    repealedBy: ResolutionNaturalID | null
}

export type TextBlock = {
    type: "TEXT";
    text: string;
    referenceMarkers: ReferenceMarker[];
};

export type TableBlock = {
    type: "TABLE";
    tableContent: TableContent;
};

export type ErrorBlock = {
    type: "ERROR";
    message: string;
};

export type ContentBlock = TextBlock | TableBlock | ErrorBlock;


export type ArticleIndex =
    | { type: "defined"; number: number; suffix: number }
    | { type: "generated"; value: number };

export type AnnexIndex =
    | { type: "defined"; number: number }
    | { type: "generated"; value: number };

export type ArticleToShow = {
    uuid: string
    index: ArticleIndex;
    content: ContentBlock[];
    modifiedBy: ResolutionNaturalID[];
    addedBy: ResolutionNaturalID | null;
} & Repealable;

export type ChapterToShow = {
    title: string;
    number: number;
    articles: ArticleToShow[];
    addedBy: ResolutionNaturalID | null;
} & Repealable

export type AnnexToShow = ({
    type: "WITH_ARTICLES",
    standaloneArticles: ArticleToShow[],
    chapters: ChapterToShow[]
    initialText: string | null;
    finalText: string | null;
} | {
    type: "TEXT";
    content: ContentBlock[];
    modifiedBy?: ResolutionNaturalID[];
}) & Repealable & {
    index: AnnexIndex;
    name: string | null;
    addedBy: ResolutionNaturalID | null;
}

export type RecitalToShow = {
    content: ContentBlock[];
    number: number
}

export type ConsiderationToShow = {
    content: ContentBlock[];
    number: number;
}


export type ResolutionToShow = {
    id: ResolutionNaturalID;
    summary: string;

    decisionBy: string;
    date: Date;

    caseFiles: string[];
    recitals: RecitalToShow[];
    considerations: ConsiderationToShow[]

    articles: ArticleToShow[];

    annexes: AnnexToShow[];

    originalFileUrl: string
} & Repealable & {
    ratifiedBy: ResolutionNaturalID | null
}

export type ResolutionVersion = {
    date: Date,
    causedBy: ResolutionNaturalID
}

export type VersionSpec = {
    date: Date | null;
    causedBy?: ResolutionNaturalID;
    exclusive?: boolean;
}

export type {ReferenceMarker};