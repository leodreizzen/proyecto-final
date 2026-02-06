import {SearchableContentType, IndexType} from "./generated/prisma/enums";
import {TransactionPrismaClient} from "./prisma.ts";
import {insertSearchableContentBulk} from "./generated/prisma/sql/insertSearchableContentBulk.ts";
import {InputJsonObject} from "@prisma/client/runtime/client";

export interface SearchableContentInsertRow {
    resolutionID: string;
    type: SearchableContentType;
    chunkNumber: number;
    mainText: string;
    context: string;
    engineVersion: string;
    embedding: number[];

    recitalNumber?: number | null;
    considerationNumber?: number | null;
    articleNumber?: number | null;
    articleSuffix?: number | null;
    articleIndexType?: IndexType | null;
    annexNumber?: number | null;
    annexIndexType?: IndexType | null;
    chapterNumber?: number | null;
}

export async function insertSearchableContentBulkBatched(data: SearchableContentInsertRow[], tx: TransactionPrismaClient) {
    const BATCH_SIZE = 500;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);
        await tx.$queryRawTyped(insertSearchableContentBulk({data: batch} as unknown as InputJsonObject));
    }
}
