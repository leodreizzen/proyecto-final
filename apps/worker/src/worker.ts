import {DelayedError, Queue, Worker} from 'bullmq';
import {processResolutionUpload} from "@/upload/job";
import ProgressReporter from "@/util/progress-reporter";
import {findOldUnfinishedUploads, findOldUnfinishedMaintenanceTasks} from "@/data/queries";
import {updateUploadStatus} from "@repo/jobs/resolutions/mutations";
import {formatErrorMessage} from "@/upload/errors";
import {resolutionsQueue} from "@repo/jobs/resolutions/queue";
import {maintenanceQueue} from "@repo/jobs/maintenance/queue";
import {redisConnection, workerConnection} from "@repo/jobs/redis";
import {publishUploadProgress, publishUploadStatus} from "@repo/pubsub/publish/uploads";
import {processEvaluateImpactJob} from "@/maintenance_tasks/impact-evaluation";
import {updateMaintenanceTaskStatus} from "@repo/jobs/maintenance/mutations";
import {processAdvancedChangesJob} from "@/maintenance_tasks/advanced_changes/jobs";
import {publishMaintenanceTaskUpdate} from "@repo/pubsub/publish/maintenance_tasks";

const worker = new Worker(
    resolutionsQueue.name,
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
    {connection: workerConnection},
);

worker.on('completed', (job) => {
    console.log(`Job ${job.id} has completed`);
});

worker.on('failed', async (job, err) => {
    try {
        console.error(`Job ${job?.id} has failed with error: ${err.message}`);
        if (job?.name == "resolutionUpload" && job.id) {
            const errorMessage = formatErrorMessage(err);
            await updateUploadStatus({uploadId: job.id, status: "FAILED", errorMessage})
            await publishUploadStatus(job.id, {status: "FAILED", errorMessage});
        }
    } catch (e) {
        console.error(`Failed to handle failure for job ${job?.id}:`, e);
    }
});

worker.on("progress", async (job) => {
    if (job.id && job.name == "resolutionUpload" && job.id) {
        await publishUploadProgress(job.id, job.progress as number);
    }
})


const maintenanceWorker = new Worker(maintenanceQueue.name,
    async (job) => {
        if (!job.id)
            throw new Error("Missing ID");
        if (job.name === "evaluateImpact") {
            return processEvaluateImpactJob(job.id);
        }
        else if (job.name == "processAdvancedChanges") {
            return processAdvancedChangesJob(job.id);
        }
        else{
            console.error("Job name not implemented:", job.name);
            await job.moveToDelayed(Date.now() + 5 * 60 * 1000, job.token);
            throw new DelayedError();
        }
    },
    {connection: workerConnection}
)

maintenanceWorker.on("completed", (job) => {
    console.log(`Maintenance job ${job.id} of type ${job.name} completed`);
})

maintenanceWorker.on("failed", async (job, err) => {
    console.error(`Maintenance job ${job?.id} of type ${job?.name} failed with error ${err.message}`);
    try {
        if (job?.id) {
            const errorMessage = "Error interno";
            await updateMaintenanceTaskStatus({taskId: job.id, status: "FAILED", errorMessage})
            await publishMaintenanceTaskUpdate(job.id, ["status", "errorMsg"]);
        }
    } catch (e) {
        console.error(`Failed to update maintenance task status for job ${job?.id}:`, e);
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
    {connection: workerConnection}
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
    const uploadsToCheck = await findOldUnfinishedUploads();
    for (const upload of uploadsToCheck) {
        const job = await resolutionsQueue.getJob(upload.id);
        const jobStatus = await job?.getState();
        if (!jobStatus || jobStatus in ["completed", "failed"]) {
            console.log(`Marking upload ${upload.id} as FAILED due to inactivity`);
            await updateUploadStatus({uploadId: upload.id, status: "FAILED", errorMessage: "Error interno", ifStatus: ["PENDING", "PROCESSING"]});
        }
    }
}

export async function cleanupMaintenanceTasks(){
    console.log("Running cleanupMaintenanceTasks job");
    const tasksToCheck = await findOldUnfinishedMaintenanceTasks();
    for (const task of tasksToCheck) {
        const job = await maintenanceQueue.getJob(task.id);
        const jobStatus = await job?.getState();
        if (!jobStatus || jobStatus in ["completed", "failed"]) {
            console.log(`Marking maintenance task ${task.id} as FAILED due to inactivity`);
            await updateMaintenanceTaskStatus({taskId: task.id, status: "FAILED", errorMessage: "Error interno", ifStatus: ["PENDING", "PROCESSING"]});
        }
    }
}
