import {checkResourcePermission} from "@/lib/auth/data-authorization";
import prisma from "@/lib/prisma";
import {UploadWithFile, UploadWithProgressAndFile} from "@/lib/definitions/uploads";
import {RESOLUTION_UPLOAD_BUCKET} from "@/lib/file-storage/assignments";
import {getUploadProgress} from "@/lib/jobs/resolutions";

export async function fetchUnfinishedUploads(): Promise<UploadWithProgressAndFile[]> {
    await checkResourcePermission("upload", "read");

    const uploads = await prisma.resolutionUpload.findMany({
        where: {
            status: {
                in: ["PENDING", "PROCESSING"]
            }
        },
        include: {
            file: true,
            resolution: {
                select: {
                    originalFile: true
                }
            }
        }
    })

    return await Promise.all(uploads.map(async upload => {
            let file = upload.file;
            if (upload.resolution) {
                file = upload.resolution.originalFile;
            }
            return {
                ...upload,
                file,
                progress: await getUploadProgress(upload.id) ?? 0
            }
        }
    ))
}

export async function fetchRecentFinishedUploads(): Promise<UploadWithFile[]> {
    await checkResourcePermission("upload", "read");

    const maxFinishedDate = new Date();
    maxFinishedDate.setHours(maxFinishedDate.getHours() - 1);

    const uploads = await prisma.resolutionUpload.findMany({
        where: {
            status: {
                in: ["COMPLETED", "FAILED"]
            }
        },
        orderBy: {
            updatedAt: "desc"
        },
        take: 10,
        include: {
            file: true,
            resolution: {
                select: {
                    originalFile: true
                }
            }
        }
    })
    return uploads.map(upload => {
        let file = upload.file;
        if (upload.resolution) {
            file = upload.resolution.originalFile;
        }
        return {
            ...upload,
            file,
        }
    });
}

export async function createResolutionUpload(fileKey: string, uploaderId: string) {
    return prisma.$transaction(async (tx) => {
        const asset = await tx.asset.findUnique({
            where: {
                bucket: RESOLUTION_UPLOAD_BUCKET,
                path: fileKey,

                resolutionUpload: null,
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