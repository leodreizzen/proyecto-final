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

export async function retryMaintenanceTaskJob(taskId: string, resolutionId: string, taskType: 'EVALUATE_IMPACT' | 'CALCULATE_EMBEDDINGS' | 'PROCESS_ADVANCED_CHANGES', depth?: number) {
    const job = await maintenanceQueue.getJob(taskId);
    if (job) {
        await job.retry();
    } else {
        if (taskType === 'EVALUATE_IMPACT') {
            await scheduleImpactTask(taskId, resolutionId);
        } else if (taskType === 'CALCULATE_EMBEDDINGS') {
            await scheduleEmbeddingsTask(taskId, resolutionId, depth || 0);
        } else if (taskType === 'PROCESS_ADVANCED_CHANGES') {
            await scheduleAdvancedChangesTask(taskId, resolutionId, depth || 0);
        } else {
            const _: never = taskType;
            throw new Error(`Unknown task type: ${taskType}`);
        }
    }
}

export async function cancelMaintenanceTaskJob(taskId: string) {
    const job = await maintenanceQueue.getJob(taskId);
    if (job) {
        await job.remove();
    }
}
