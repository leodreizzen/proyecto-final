import {Queue} from "bullmq";
import {redisConnection} from "@/lib/jobs/connection";

const maintenanceQueue = new Queue('maintenance', {connection: redisConnection});

export async function cancelMaintenanceTaskJob(taskId: string) {
    const job = await maintenanceQueue.getJob(taskId);
    job?.remove();
}