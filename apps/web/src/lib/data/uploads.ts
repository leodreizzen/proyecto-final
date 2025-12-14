import {checkResourcePermission} from "@/lib/auth/data-authorization";
import prisma from "@/lib/prisma";
import {UploadWithFile, UploadWithProgressAndFile} from "@/lib/definitions/uploads";

export async function fetchUnfinishedUploads(): Promise<UploadWithProgressAndFile[]> {
    await checkResourcePermission("upload", "read");

    const uploads = await prisma.resolutionUpload.findMany({
        where: {
            status: {
                in: ["PENDING", "PROCESSING"]
            }
        },
        include: {
            file: true
        }
    })

    return uploads.map(upload => ({
        ...upload,
        progress: 50 // TODO: actual progress
    }))
}

export async function fetchRecentFinishedUploads(): Promise<UploadWithFile[]> {
    // TODO filter by date / count
    await checkResourcePermission("upload", "read");

    return prisma.resolutionUpload.findMany({
        where: {
            status: {
                in: ["COMPLETED", "FAILED"]
            },
        },
        include: {
            file: true
        }
    })
}