"use server"

import {VoidActionResult} from "@/lib/definitions/actions";
import {authCheck} from "@/lib/auth/route-authorization";
import {retryMaintenanceTask} from "@/lib/data/maintenance";

export async function retryMaintenanceTaskAction({id}: { id: string }): Promise<VoidActionResult<undefined>> {
    await authCheck(["ADMIN"]);

    try {
        await retryMaintenanceTask(id);
        return {
            success: true,
        }
    } catch (error) {
        console.error("Error retrying maintenance task:", error);
        return {
            success: false,
            error: undefined
        }
    }
}