import {Queue} from "bullmq";
import {redisConnection} from "../redis";

export const maintenanceQueue = new Queue('maintenance', {connection: redisConnection});

export async function scheduleImpactTask(taskId:string, resolutionId: string) {
    await maintenanceQueue.add('evaluateImpact', {resolutionId}, {
        jobId: taskId,
        removeOnComplete: true,
        removeOnFail: 100
    });
}

export async function scheduleEmbeddingsTask(taskId: string, resolutionId: string, depth: number) {
    await maintenanceQueue.add('generateEmbeddings', {resolutionId}, {
        jobId: taskId,
        removeOnComplete: true,
        removeOnFail: 100,
        priority: depth + 1
    });
}

export async function scheduleAdvancedChangesTask(taskId: string, resolutionId: string, depth: number) {
    await maintenanceQueue.add('processAdvancedChanges', {resolutionId}, {
        jobId: taskId,
        removeOnComplete: true,
        removeOnFail: 100,
        priority: depth + 1
    });
}

export async function cancelMaintenanceTaskJob(taskId: string) {
    const job = await maintenanceQueue.getJob(taskId);
    if (job) {
        await job.remove();
    }
}
