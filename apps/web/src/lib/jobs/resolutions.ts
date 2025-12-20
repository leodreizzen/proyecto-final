import { Queue } from 'bullmq';
import {redisConnection} from "@/lib/jobs/connection";

const resolutionsQueue = new Queue('resolutions', {connection: redisConnection});

export async function createUploadJob(uploadId: string) {
    await resolutionsQueue.add('resolutionUpload', {}, {jobId: uploadId, removeOnComplete: true, removeOnFail: true});
}

export async function getUploadProgress(uploadId: string): Promise<number | null> {
    const job = await resolutionsQueue.getJob(uploadId);
    if (!job) {
        return null;
    }
    return job.progress as number | null;
}