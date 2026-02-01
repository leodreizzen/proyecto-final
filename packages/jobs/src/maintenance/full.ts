import {TransactionPrismaClient} from "@repo/db/prisma";
import {upsertImpactEvaluationTask} from "./mutations";
import {scheduleImpactTask} from "./queue";

export async function createImpactTask(resolutionId: string, tx: TransactionPrismaClient) {
    const eventId = `upload_res_${resolutionId}_${Date.now()}`;
    const dbTask = await upsertImpactEvaluationTask(resolutionId, eventId, tx);
    if (dbTask.created) {
        await scheduleImpactTask(dbTask.id, resolutionId);
    }
    return dbTask
}