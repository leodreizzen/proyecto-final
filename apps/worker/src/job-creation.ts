import IORedis from "ioredis";
import {Asset} from "@repo/db/prisma/client";
import {Queue} from "bullmq";
import prisma, {TransactionPrismaClient} from "@repo/db/prisma";
import {v7} from "uuid";

if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not defined");
}
const redisUrl = process.env.REDIS_URL;

export const redisConnection = new IORedis(redisUrl, {maxRetriesPerRequest: 5, lazyConnect: true});

export const assetsQueue = new Queue('assets', {connection: redisConnection});
export const maintenanceQueue = new Queue('maintenance', {connection: redisConnection});

export async function createDeleteJob(file: Asset) {
    await assetsQueue.add('deleteAsset', {fileId: file.id}, {
        jobId: `delete-${file.id}`,
        removeOnComplete: true,
        removeOnFail: 100
    });
}

export async function scheduleImpactTask(taskId:string, resolutionId: string, tx: TransactionPrismaClient = prisma) {
    await maintenanceQueue.add('evaluateImpact', {resolutionId}, {
        jobId: taskId,
        removeOnComplete: true,
        removeOnFail: 100
    });
}

export async function scheduleEmbeddingsTask(taskId: string, resolutionId: string, depth: number) {
    await maintenanceQueue.add('generateEmbeddings', {resolutionId}, {
        jobId: taskId,
        removeOnComplete: true,
        removeOnFail: 100,
        priority: depth + 1
    });
}

export async function scheduleAdvancedChangesTask(taskId: string, resolutionId: string, depth: number) {
    await maintenanceQueue.add('processAdvancedChanges', {resolutionId}, {
        jobId: taskId,
        removeOnComplete: true,
        removeOnFail: 100,
        priority: depth + 1
    });
}
