import {Queue, Worker} from 'bullmq';
import IORedis from 'ioredis';
import {processResolutionUpload} from "@/upload/job";
import ProgressReporter from "@/util/progress-reporter";
import {fetchOldUnfinishedUploads, setUploadStatus} from "@/data/uploads";
import {formatErrorMessage} from "@/upload/errors";
import {assetsQueue} from "@/job-creation";

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

worker.on('failed', async (job, err) => {
    console.error(`Job ${job?.id} has failed with error: ${err.message}`);
    if (job?.name == "resolutionUpload" && job.id) {
        await setUploadStatus({uploadId: job.id, status: "FAILED", errorMessage: formatErrorMessage(err.message)})
    }
});

const scheduledWorker = new Worker(
    'scheduled',
    async (job) => {
        console.log(`Processing scheduled job ${job.id} of type ${job.name}`);
        if (job.name === "cleanupUploads") {
            await cleanupUploads();
        }
    },
    {connection: redisConnection}
)

const scheduledQueue = new Queue('scheduled', {connection: redisConnection});

await scheduledQueue.upsertJobScheduler(
    "cleanupUploads",
    { pattern: '*/10 * * * *' },
    {
        name: 'cleanupUploads',
        opts: {
            removeOnComplete: true,
            removeOnFail: 5,
        },
    },
);

export async function cleanupUploads(){
    console.log("Running cleanupUploads job");
    const uploadsToCheck = await fetchOldUnfinishedUploads();
    for (const upload of uploadsToCheck) {
        const job = await assetsQueue.getJob(upload.id);
        const jobStatus = await job?.getState();
        if (!jobStatus || jobStatus in ["completed", "failed"]) {
            console.log(`Marking upload ${upload.id} as FAILED due to inactivity`);
            await setUploadStatus({uploadId: upload.id, status: "FAILED", errorMessage: "Error interno", ifStatus: ["PENDING", "PROCESSING"]});
        }
    }
}
