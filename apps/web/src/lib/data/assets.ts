import {checkResourcePermission} from "@/lib/auth/data-authorization";
import prisma from "@/lib/prisma";
import {resolutionUploadKey} from "@/lib/file-storage/assignments";

export async function savePendingUpload({fileName, bucket, fileSize, fileType}: {fileName: string, bucket: string, fileSize: number, fileType: string}): Promise<string> {
    await checkResourcePermission("upload", "create");
    const key = resolutionUploadKey(fileName);
    await prisma.asset.create({
        data: {
            originalFileName: fileName,
            bucket,
            size: fileSize,
            path: key,
            mimeType: fileType
        }
    })
    return key;
}