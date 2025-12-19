import { Queue } from 'bullmq';
import {redisConnection} from "@/lib/jobs/connection";

const resolutionsQueue = new Queue('resolutions', {connection: redisConnection});

export async function createUploadJob(uploadId: string) {
    await resolutionsQueue.add('resolutionUpload', {}, {jobId: uploadId, removeOnComplete: true, removeOnFail: true});
}
