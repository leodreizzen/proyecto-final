import IORedis from "ioredis";
import {Asset} from "@repo/db/prisma/client";
import {Queue} from "bullmq";

if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not defined");
}
const redisUrl = process.env.REDIS_URL;

export const redisConnection = new IORedis(redisUrl, {maxRetriesPerRequest: 5});

export const assetsQueue = new Queue('assets', {connection: redisConnection});

export async function createDeleteJob(file: Asset) {
    await assetsQueue.add('deleteAsset', {fileId: file.id}, {jobId: `delete-${file.id}`, removeOnComplete: true, removeOnFail: 100});
}