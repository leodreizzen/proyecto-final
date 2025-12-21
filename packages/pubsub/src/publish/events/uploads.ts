import {UploadStatus} from "@repo/db/prisma/enums";
import {publish} from "../publish";

export async function publishUploadProgress(uploadId: string, progress: number) {
    await publish("UPLOADS_SPECIFIC", {
        type: "PROGRESS",
        progress: progress,
    }, {id: uploadId});
}

export type UploadStatusData = {
    status: Exclude<UploadStatus, "FAILED">,
} | {
    status: "FAILED",
    errorMessage: string,
}

export async function publishUploadStatus(uploadId: string, data: UploadStatusData) {
    await publish("UPLOADS_SPECIFIC", {
        type: "STATUS",
        ...data
    }, {id: uploadId});
}

export async function publishNewUpload(uploadId: string) {
    await publish("UPLOADS_GLOBAL", {
        type: "NEW_UPLOAD",
        uploadId: uploadId,
    })
}