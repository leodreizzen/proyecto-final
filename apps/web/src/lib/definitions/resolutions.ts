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

export type ResolutionIDToShow = {
    initial: string;
    number: number;
    year: number;
}

export type Repealable = {
    repealedBy: ResolutionIDToShow | null
}

export type TableToShow = Table

export type ArticleToShow = {
    number: number;
    suffix: number;
    text: string;
    tables: TableToShow[];
    modifiedBy: ResolutionIDToShow[];
    addedBy: ResolutionIDToShow | null;
} & Repealable;

export type ChapterToShow = {
    title: string;
    number: number;
    articles: ArticleToShow[];
    addedBy: ResolutionIDToShow | null;
} & Repealable

export type AnnexToShow = ({
    type: "WithArticles",
    standaloneArticles: ArticleToShow[],
    chapters: ChapterToShow[]
    initialText: string | null;
    finalText: string | null;
} | {
    type: "TEXT";
    content: string;
    tables: TableToShow[];
    modifiedBy?: ResolutionIDToShow[];
}) & Repealable & {
    number: number;
    addedBy: ResolutionIDToShow | null;
}

export type RecitalToShow = {
    text: string;
    tables: TableToShow[]
}

export type ConsiderationToShow = {
    text: string;
    tables: TableToShow[]
}


export type ResolutionToShow = {
    id: ResolutionIDToShow;

    decisionBy: string;
    date: Date;

    caseFiles: string[];
    recitals: RecitalToShow[];
    considerations: ConsiderationToShow[]

    articles: ArticleToShow[];

    annexes: AnnexToShow[];

    originalFileId: string
} & Repealable

export type ResolutionVersion = {
    date: Date,
    causedBy: ResolutionIDToShow
}