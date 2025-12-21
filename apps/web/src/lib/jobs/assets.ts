//TODO move to package
import {Queue} from "bullmq";
import {redisConnection} from "@/lib/jobs/connection";

const assetsQueue = new Queue('resolutions', {connection: redisConnection});

export async function createDeleteAssetJob(fileId: string) {
    await assetsQueue.add('deleteAsset', {fileId: fileId}, {jobId: `delete-${fileId}`, removeOnComplete: true, removeOnFail: 100});
}