import {DelayedError, Queue, Worker} from 'bullmq';
import IORedis from 'ioredis';
import {processResolutionUpload} from "@/upload/job";
import ProgressReporter from "@/util/progress-reporter";
import {fetchOldUnfinishedUploads, setUploadStatus} from "@/data/uploads";
import {formatErrorMessage} from "@/upload/errors";
import {assetsQueue, maintenanceQueue} from "@/job-creation";
import {publishUploadProgress, publishUploadStatus} from "@repo/pubsub/publish/uploads";
import {processEvaluateImpactJob} from "@/maintenance_tasks/impact-evaluation";
import {fetchOldUnfinishedMaintenanceTasks, setMaintenanceTaskStatus} from "@/data/maintenance";

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
                console.log(`Job ${job.id} progress: ${(progress * 100).toFixed(2)}%`);
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
        const errorMessage = formatErrorMessage(err);
        await setUploadStatus({uploadId: job.id, status: "FAILED", errorMessage})
        await publishUploadStatus(job.id, {status: "FAILED", errorMessage});
    }
});

worker.on("progress", async (job) => {
    if (job.id && job.name == "resolutionUpload" && job.id) {
        await publishUploadProgress(job.id, job.progress as number);
    }
})


const maintenanceWorker = new Worker("maintenance",
    async (job) => {
        if (!job.id)
            throw new Error("Missing ID");
        if (job.name === "evaluateImpact") {
            return processEvaluateImpactJob(job.id);
        } else {
            console.error("Job name not implemented:", job.name);
            await job.moveToDelayed(Date.now() + 5 * 60 * 1000, job.token);
            throw new DelayedError();
        }
    },
    {connection: redisConnection}
)

maintenanceWorker.on("completed", (job) => {
    console.log(`Maintenance job ${job.id} of type ${job.name} completed`);
})

maintenanceWorker.on("failed", async (job, err) => {
    console.error(`Maintenance job ${job?.id} of type ${job?.name} failed with error ${err.message}`);
    if (job?.id) {
        const errorMessage = "Error interno";
        await setMaintenanceTaskStatus({taskId: job.id, status: "FAILED", errorMessage})
    }
})


const _scheduledWorker = new Worker(
    'scheduled',
    async (job) => {
        console.log(`Processing scheduled job ${job.id} of type ${job.name}`);
        if (job.name === "cleanupUploads") {
            await cleanupUploads();
        } else if (job.name === "cleanupMaintenanceTasks") {
            await cleanupMaintenanceTasks();

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

await scheduledQueue.upsertJobScheduler(
    "cleanupMaintenanceTasks",
    { pattern: '*/10 * * * *' },
    {
        name: 'cleanupMaintenanceTasks',
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

export async function cleanupMaintenanceTasks(){
    console.log("Running cleanupMaintenanceTasks job");
    const tasksToCheck = await fetchOldUnfinishedMaintenanceTasks();
    for (const task of tasksToCheck) {
        const job = await maintenanceQueue.getJob(task.id);
        const jobStatus = await job?.getState();
        if (!jobStatus || jobStatus in ["completed", "failed"]) {
            console.log(`Marking maintenance task ${task.id} as FAILED due to inactivity`);
            await setMaintenanceTaskStatus({taskId: task.id, status: "FAILED", errorMessage: "Error interno", ifStatus: ["PENDING", "PROCESSING"]});
        }
    }
}


