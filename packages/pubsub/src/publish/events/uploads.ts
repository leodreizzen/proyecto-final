import {UploadStatus} from "@repo/db/prisma/enums";
import {publish} from "../publish.ts";

export async function publishUploadProgress(uploadId: string, progress: number) {
    await publish("UPLOADS_SPECIFIC", {
        type: "PROGRESS",
        progress: progress,
    }, {id: uploadId});
}

export async function publishUploadStatus(uploadId: string, status: UploadStatus) {
    await publish("UPLOADS_SPECIFIC", {
        type: "STATUS",
        status: status
    }, {id: uploadId});
}

export async function publishNewUpload(uploadId: string) {
    await publish("UPLOADS_GLOBAL", {
        type: "NEW_UPLOAD",
        uploadId: uploadId,
    })
}