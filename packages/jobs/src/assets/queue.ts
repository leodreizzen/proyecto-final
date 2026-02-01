import {Queue} from "bullmq";
import {redisConnection} from "../redis";

export const assetsQueue = new Queue('assets', {connection: redisConnection});

export async function createDeleteAssetJob(fileId: string) {
    await assetsQueue.add('deleteAsset', {fileId: fileId}, {jobId: `delete-${fileId}`, removeOnComplete: true, removeOnFail: 100});
}
