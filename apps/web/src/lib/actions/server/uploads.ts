"use server"

import {z} from "zod";
import {MAX_FILE_SIZE} from "../../../../config/files";
import {authCheck} from "@/lib/auth/route-authorization";
import {savePendingUpload} from "@/lib/data/assets";
import {checkFileExistsInStorage, signUploadURL} from "@/lib/file-storage/server";
import {ActionResult} from "@/lib/definitions/actions";
import {RESOLUTION_UPLOAD_BUCKET} from "@/lib/file-storage/assignments";
import {createResolutionUpload, deleteFailedUpload} from "@/lib/data/uploads";
import {revalidatePath} from "next/cache";

const GetResolutionUploadUrlSchema = z.object({
    fileName: z.string().min(1),
    fileSize: z.number().min(1).max(MAX_FILE_SIZE),
    fileType: z.literal("application/pdf"),
});

type UploadUrlError = "INVALID_DATA"
type UploadUrlResultData = {
    url: string;
    key: string;
}
export async function getResolutionUploadUrl(data: z.infer<typeof GetResolutionUploadUrlSchema>): Promise<ActionResult<UploadUrlResultData, UploadUrlError>> {
    await authCheck(["ADMIN"]);
    const inputData = GetResolutionUploadUrlSchema.safeParse(data);
    if (!inputData.success) {
        return {
            success: false,
            error: "INVALID_DATA"
        }
    }
    const {fileName, fileSize, fileType} = inputData.data;
    const bucket = RESOLUTION_UPLOAD_BUCKET;
    const key = await savePendingUpload({
        fileName,
        bucket,
        fileSize,
        fileType
    });

    const url = await signUploadURL(bucket, key, fileSize, fileType);

    return {
        success: true,
        data: {
            url,
            key
        }
    }
}

const SaveUploadedResolutionSchema = z.object({
    key: z.string().min(1),
});

async function saveUploadedResolution(keyData: z.infer<typeof SaveUploadedResolutionSchema>) {
    const user = await authCheck(["ADMIN"]);
    try {
        const inputData = SaveUploadedResolutionSchema.safeParse(keyData);
        if (!inputData.success) {
            return {
                success: false,
                error: "INVALID_DATA"
            }
        }

        if (!await checkFileExistsInStorage(RESOLUTION_UPLOAD_BUCKET, inputData.data.key)) {
            console.error(`Failed to save uploaded resolution with key ${keyData}: file does not exist in storage}`);
            return {
                success: false,
                error: "INVALID_FILE"
            }
        }

        const createUploadRes = await createResolutionUpload(inputData.data.key, user.id);
        if (!createUploadRes.success) {
            return {
                success: false,
                error: createUploadRes.error
            }
        }

        try {
            //TODO await createUploadJob(createUploadRes.data.id);
        } catch (e) {
            console.error(`Failed to create processing job for upload ${createUploadRes.data.id}:`, e);
            await deleteFailedUpload(createUploadRes.data.id);
            return {
                success: false,
                error: "INTERNAL_ERROR"
            }
        }
        revalidatePath("/admin")
        return {
            success: true
        }
    } catch (error) {
        console.error("Error in saveUploadedResolution:", error);
        return {
            success: false,
            error: "INTERNAL_ERROR"
        }
    }
}

export default saveUploadedResolution