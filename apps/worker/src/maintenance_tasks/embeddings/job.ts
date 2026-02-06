import {findMaintenanceTask} from "@/data/queries";
import {updateMaintenanceTaskStatus} from "@repo/jobs/maintenance/mutations";
import {publishMaintenanceTaskUpdate} from "@repo/pubsub/publish/maintenance_tasks";
import {getAssembledResolution} from "@repo/resolution-assembly";
import {getDataToEmbed} from "./data-extractor";
import {
    ChunkToEmbed,
    ChunkWithEmbedding,
    DataToEmbed,
    DataWithEmbeddings
} from "@/maintenance_tasks/embeddings/definitions";
import {calculateChunkEmbeddings} from "@/maintenance_tasks/embeddings/embedding-calculator";
import prisma from "@repo/db/prisma";
import {replaceEmbeddings} from "@/data/replace-embeddings";

export async function processEmbeddingsJob(jobId: string) {
    const task = await findMaintenanceTask(jobId);
    if (!task) {
        throw new Error(`Maintenance task with ID ${jobId} not found`);
    }
    try {
        console.log(`Starting embeddings job for task ${jobId} - Resolution ID: ${task.resolutionId}`);
        await updateMaintenanceTaskStatus({taskId: jobId, status: "PROCESSING"});
        await publishMaintenanceTaskUpdate(jobId, ["status"]);

        // Validate assembly: date: null implies "Latest Available Version" (Vigente)
        const resolution = await getAssembledResolution(task.resolutionId, {date: null});
        if (!resolution) {
            throw new Error(`Resolution with ID ${task.resolutionId} not found`);
        }

        const dataToEmbed = getDataToEmbed(resolution.resolutionData);

        const dataWithEmbeddings = await addEmbeddingsToData(dataToEmbed);

        await prisma.$transaction(async tx => {
            await replaceEmbeddings(task.resolutionId, dataWithEmbeddings, tx);
            await updateMaintenanceTaskStatus({taskId: task.id, status: "COMPLETED", tx});
        })
        await publishMaintenanceTaskUpdate(jobId, ["status"]);
    } catch (error) {
        console.error(error);
        await updateMaintenanceTaskStatus({taskId: jobId, status: "FAILED", errorMessage: "Error interno"});
        await publishMaintenanceTaskUpdate(jobId, ["status", "errorMsg"]);
    }
}

export async function addEmbeddingsToData(data: DataToEmbed[]): Promise<DataWithEmbeddings[]> {
    const allChunks: ChunkToEmbed[] = [];
    for (const item of data) {
        allChunks.push(...item.chunks)
    }

    const embeddings = await calculateChunkEmbeddings(allChunks);

    if (embeddings.length !== allChunks.length) {
        throw new Error("Embeddings count does not match chunks count");
    }

    const dataWithEmbeddings: DataWithEmbeddings[] = [];

    let embeddingIndex = 0;
    for (const item of data) {
        const itemChunksWithEmbeddings: ChunkWithEmbedding[] = [];
        for (const chunk of item.chunks) {
            const chunkWithEmbedding: ChunkWithEmbedding = {
                ...chunk,
                embedding: embeddings[embeddingIndex]!
            }
            itemChunksWithEmbeddings.push(chunkWithEmbedding);
            embeddingIndex++;
        }

        dataWithEmbeddings.push({
            ...item,
            chunks: itemChunksWithEmbeddings
        });
    }

    return dataWithEmbeddings;


}