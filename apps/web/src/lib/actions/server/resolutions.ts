"use server"

import {z} from "zod";
import {authCheck} from "@/lib/auth/route-authorization";
import {deleteResolutionById} from "@/lib/data/resolutions";
import {revalidatePath} from "next/cache";
import {VoidActionResult} from "@/lib/definitions/actions";
import {publishDeleteResolution} from "@repo/pubsub/publish/resolutions";
import prisma from "@repo/db/prisma";
import {deleteMaintenanceTasksById, fetchMaintenanceTasks} from "@/lib/data/maintenance";
import {publishDeletedMaintenanceTasks} from "@repo/pubsub/publish/maintenance_tasks";
import {cancelMaintenanceTaskJob} from "@repo/jobs/maintenance/queue";

const DeleteSchema = z.object({
    id: z.uuidv7()
})

export async function deleteResolution(params: z.infer<typeof DeleteSchema>): Promise<VoidActionResult<undefined>> {
    await authCheck(["ADMIN"]);
    const {id} = DeleteSchema.parse(params);
    try {
        const {taskIds} = await prisma.$transaction(async (tx) => {
            const maintenanceTasks = await fetchMaintenanceTasks({cursor: null, filter: "ALL", resolutionId: id, limit: null});
            const taskIds = maintenanceTasks.map(task => task.id);

            await deleteMaintenanceTasksById(taskIds)

            // TODO create impact evaluation tasks before deleting resoluition
            await deleteResolutionById(id);
            return {taskIds};
        });

        await Promise.all(taskIds.map(async taskId => {
            try{
                await cancelMaintenanceTaskJob(taskId)
            } catch (e) {
                console.error(`Failed to cancel maintenance task job for task ID ${taskId}:`, e);
                // suppress error because job is probably running
            }
        }));

        await publishDeletedMaintenanceTasks(taskIds);
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