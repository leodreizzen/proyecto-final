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
const maintenanceQueue = new Queue('maintenance', {connection: redisConnection});

export async function createDeleteJob(file: Asset) {
    await assetsQueue.add('deleteAsset', {fileId: file.id}, {
        jobId: `delete-${file.id}`,
        removeOnComplete: true,
        removeOnFail: 100
    });
}

export async function scheduleImpactTask(resolutionId: string, tx: TransactionPrismaClient = prisma) {
    const task = await tx.maintenanceTask.create({
        data: {
            type: 'EVALUATE_IMPACT',
            resolutionId: resolutionId,
            status: 'PENDING',
            triggerEventId: v7(),
        }
    });
    await maintenanceQueue.add('evaluateImpact', {resolutionId}, {
        jobId: task.id,
        removeOnComplete: true,
        removeOnFail: 100
    });
}