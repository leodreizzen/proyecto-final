"use server"

import {z} from "zod";
import {authCheck} from "@/lib/auth/route-authorization";
import {deleteResolutionById} from "@/lib/data/resolutions";
import {revalidatePath} from "next/cache";
import {VoidActionResult} from "@/lib/definitions/actions";
import {publishDeleteResolution} from "@repo/pubsub/publish/resolutions";
import prisma, {TransactionPrismaClient} from "@repo/db/prisma";
import {deleteMaintenanceTasksById, fetchMaintenanceTasks} from "@/lib/data/maintenance";
import {publishDeletedMaintenanceTasks, publishNewMaintenanceTasks} from "@repo/pubsub/publish/maintenance_tasks";
import {cancelMaintenanceTaskJob, scheduleImpactTask} from "@repo/jobs/maintenance/queue";
import {getDirectlyAffectedResolutionIds} from "@repo/resolution-assembly";
import {upsertImpactEvaluationTask} from "@repo/jobs/maintenance/mutations";

const DeleteSchema = z.object({
    id: z.uuidv7()
})

export async function deleteResolution(params: z.infer<typeof DeleteSchema>): Promise<VoidActionResult<undefined>> {
    await authCheck(["ADMIN"]);
    const {id} = DeleteSchema.parse(params);
    try {
        const {deletedTaskIds, createdTasks} = await prisma.$transaction(async (tx) => {
            const maintenanceTasks = await fetchMaintenanceTasks({cursor: null, filter: "ALL", resolutionId: id, limit: null});
            const deletedTaskIds = maintenanceTasks.map(task => task.id);

            await deleteMaintenanceTasksById(deletedTaskIds)

            const {createdTasks, deletedTaskIds: deletedOldtaskIds} = await createImpactTasksBeforeDeletion(id, tx);

            await deleteResolutionById(id, tx);
            return {deletedTaskIds: [...deletedTaskIds, ...deletedOldtaskIds], createdTasks};
        });

        await Promise.all(deletedTaskIds.map(async taskId => {
            try{
                await cancelMaintenanceTaskJob(taskId)
            } catch (e) {
                console.error(`Failed to cancel maintenance task job for task ID ${taskId}:`, e);
                // suppress error because job is probably running
            }
        }));

        for (const task of createdTasks) {
            await scheduleImpactTask(task.taskId, task.resolutionId);
        }
        const createdTaskIds = createdTasks.map(t => t.taskId);
        await publishDeletedMaintenanceTasks(deletedTaskIds);
        await publishNewMaintenanceTasks(createdTaskIds);
    } catch (e) {
        console.error(e)
        return {
            success: false,
            error: undefined
        }
    }
    await publishDeleteResolution(id);
    revalidatePath("/admin");
    return {
        success: true
    }
}

async function createImpactTasksBeforeDeletion(resolutionId: string, tx: TransactionPrismaClient) {
    const eventId = `delete_res_${resolutionId}_${Date.now()}`;
    const impacted = await getDirectlyAffectedResolutionIds(resolutionId, tx);
    const createdTasks = [];
    const deletedTaskIds = [];
    for (const impactedResolutionId of impacted) {
        const task = await upsertImpactEvaluationTask(impactedResolutionId, eventId, {}, tx);
        if (task.created) {
            createdTasks.push({taskId: task.id, resolutionId: impactedResolutionId});
            if (task.deletedTaskIds.length > 0) {
                deletedTaskIds.push(...task.deletedTaskIds);
            }
        }
    }
    return {
        createdTasks: createdTasks,
        deletedTaskIds: deletedTaskIds
    };
}