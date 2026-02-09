import {UploadStatus} from "@repo/db/prisma/enums";

export function compareUploads(a: {uploadedAt: Date, status: UploadStatus}, b: {uploadedAt: Date, status: UploadStatus}): number {
    if (a.status === b.status) {
        return a.uploadedAt.getTime() - b.uploadedAt.getTime();
    }
    else {
        if (a.status === "PROCESSING") return -1;
        else return 1;
    }
}