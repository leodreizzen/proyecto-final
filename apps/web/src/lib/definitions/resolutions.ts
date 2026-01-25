import {Resolution} from "@repo/db/prisma/client";
import {Table} from "@repo/db/tables";

export type resolutionStatus = "ok" | "missingRef" | "inconsistent"

export interface ResolutionWithStatus extends Resolution {
    status: resolutionStatus;
}

export type ResolutionCounts = {
    total: number;
    ok: number;
    missingRef: number;
    inconsistent: number;
}

export type ResolutionNaturalID = {
    initial: string;
    number: number;
    year: number;
}

export type Repealable = {
    repealedBy: ResolutionNaturalID | null
}

export type TableToShow = Table

export type ArticleToShow = {
    number: number;
    suffix: number;
    text: string;
    tables: TableToShow[];
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
    content: string;
    tables: TableToShow[];
    modifiedBy?: ResolutionNaturalID[];
}) & Repealable & {
    number: number;
    addedBy: ResolutionNaturalID | null;
}

export type RecitalToShow = {
    text: string;
    tables: TableToShow[];
    number: number
}

export type ConsiderationToShow = {
    text: string;
    tables: TableToShow[];
    number: number;
}


export type ResolutionToShow = {
    id: ResolutionNaturalID;

    decisionBy: string;
    date: Date;

    caseFiles: string[];
    recitals: RecitalToShow[];
    considerations: ConsiderationToShow[]

    articles: ArticleToShow[];

    annexes: AnnexToShow[];

    originalFileId: string
} & Repealable & {
    ratifiedBy: ResolutionNaturalID[] | null
}

export type ResolutionVersion = {
    date: Date,
    causedBy: ResolutionNaturalID
}