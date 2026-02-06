import {DataWithEmbeddings} from "@/maintenance_tasks/embeddings/definitions";
import {TransactionPrismaClient} from "@repo/db/prisma";
import {insertSearchableContentBulkBatched, SearchableContentInsertRow} from "@repo/db/embeddings";

const ENGINE_VERSION = "20260205-00-gemini-embedding-001";

export async function replaceEmbeddings(resolutionId: string, data: DataWithEmbeddings[], tx: TransactionPrismaClient) {
    await tx.searchableContent.deleteMany({
        where: {
            resolutionID: resolutionId
        }
    });

    const recordsToInsert: SearchableContentInsertRow[] = data.flatMap(item => {
            let locationFields: Pick<SearchableContentInsertRow, "recitalNumber" | "considerationNumber" | "annexNumber" | "chapterNumber" | "articleNumber" | "annexIndexType" | "articleIndexType" | "articleSuffix"> = {};
            if (item.type === "RECITAL") {
                locationFields = {
                    recitalNumber: item.number,
                }
            } else if (item.type === "CONSIDERATION") {
                locationFields = {
                    considerationNumber: item.number,
                }
            } else if (item.type === "TEXT_ANNEX") {
                locationFields = {
                    annexNumber: item.annexIndex.type === "defined" ? item.annexIndex.number : item.annexIndex.value,
                    annexIndexType: item.annexIndex.type === "defined" ? "DEFINED" : "GENERATED",
                }
            } else if (item.type === "ARTICLE") {
                let annexIndexType: SearchableContentInsertRow["annexIndexType"] = null;
                if (item.location.annexIndex) {
                    annexIndexType = item.location.annexIndex.type === "defined" ? "DEFINED" : "GENERATED";
                }
                locationFields = {
                    articleNumber: item.location.articleIndex.type === "defined" ? item.location.articleIndex.number : item.location.articleIndex.value,
                    articleSuffix: item.location.articleIndex.type === "defined" ? item.location.articleIndex.suffix : null,
                    articleIndexType: item.location.articleIndex.type === "defined" ? "DEFINED" : "GENERATED",
                    chapterNumber: item.location.chapterNumber,
                    annexIndexType,
                    annexNumber: item.location.annexIndex ? (item.location.annexIndex.type === "defined" ? item.location.annexIndex.number : item.location.annexIndex.value) : null,
                }
            }
            return item.chunks.map((chunk, chunkIdx) => ({
                resolutionID: resolutionId,
                embedding: chunk.embedding,
                type: item.type,
                chunkNumber: chunkIdx,
                mainText: chunk.mainText,
                context: chunk.contextText,
                engineVersion: ENGINE_VERSION,
                ...locationFields,
            } satisfies SearchableContentInsertRow))
        }
    );

    await insertSearchableContentBulkBatched(recordsToInsert, tx);
}

