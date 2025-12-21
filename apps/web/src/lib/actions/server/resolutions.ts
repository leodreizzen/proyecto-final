"use server"

import {z} from "zod";
import {authCheck} from "@/lib/auth/route-authorization";
import {deleteResolutionById} from "@/lib/data/resolutions";
import {revalidatePath} from "next/cache";
import {VoidActionResult} from "@/lib/definitions/actions";
import {publishDeleteResolution} from "@repo/pubsub/publish/resolutions";

const DeleteSchema = z.object({
    id: z.uuidv7()
})

export async function deleteResolution(params: z.infer<typeof DeleteSchema>): Promise<VoidActionResult<undefined>> {
    await authCheck(["ADMIN"]);
    const {id} = DeleteSchema.parse(params);
    try {
        await deleteResolutionById(id);
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