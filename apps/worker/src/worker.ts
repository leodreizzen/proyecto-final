import {Worker} from 'bullmq';
import IORedis from 'ioredis';
import {processResolutionUpload} from "@/upload/job";
import ProgressReporter from "@/util/progress-reporter";

if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not defined");
}
const redisUrl = process.env.REDIS_URL;

export const redisConnection = new IORedis(redisUrl, {maxRetriesPerRequest: null});

const worker = new Worker(
    'resolutions',
    async (job) => {
        console.log(`Processing job ${job.id} of type ${job.name}`);
        const progressReporter = new ProgressReporter({
            name: "root", onReport: (progress) => {
                job.updateProgress(progress);
            }
        })
        if (job.name == "resolutionUpload") {
            return processResolutionUpload(job, progressReporter);
        } else {
            throw new Error(`Unknown job name: ${job.name}`);
        }
    },
    {connection: redisConnection},
);

worker.on('completed', (job) => {
    console.log(`Job ${job.id} has completed`);
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} has failed with error: ${err.message}`);
});
