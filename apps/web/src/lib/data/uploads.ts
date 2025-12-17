import {checkResourcePermission} from "@/lib/auth/data-authorization";
import prisma from "@/lib/prisma";
import {UploadWithFile, UploadWithProgressAndFile} from "@/lib/definitions/uploads";
import {RESOLUTION_UPLOAD_BUCKET} from "@/lib/file-storage/assignments";

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

export async function createResolutionUpload(fileKey: string, uploaderId: string) {
    return prisma.$transaction(async (tx) => {
        const asset = await tx.asset.findUnique({
            where: {
                bucket: RESOLUTION_UPLOAD_BUCKET,
                path: fileKey,

                resolutionUpload : null,
            }
        })
        if (!asset) {
            return {
                success: false,
                error: "INVALID_ASSET"
            } as const
        }

        const upload = await tx.resolutionUpload.create({
            data: {
                status: "PENDING",
                file: {
                    connect: {
                        id: asset.id
                    }
                },
                uploader: {
                    connect: {
                        id: uploaderId
                    }
                },
            }
        });
        return {
            success: true,
            data: upload
        }
    })
}

export async function deleteFailedUpload(uploadId: string) {
    await prisma.resolutionUpload.delete({
        where: {
            id: uploadId,
            status: {
                in: [
                    "FAILED",
                    "PENDING"
                ]
            }
        }
    })
}