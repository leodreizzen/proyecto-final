import {checkResourcePermission} from "@/lib/auth/data-authorization";
import prisma from "@/lib/prisma";
import {UploadWithFile, UploadWithProgressAndFile} from "@/lib/definitions/uploads";
import {RESOLUTION_UPLOAD_BUCKET} from "@/lib/file-storage/assignments";
import {getUploadProgress} from "@/lib/jobs/resolutions";
import {Mutable} from "@/lib/definitions/util";

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
                    initial: true,
                    number: true,
                    year: true,
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
                resolution: upload.resolution,
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
                    originalFile: true,
                    initial: true,
                    number: true,
                    year: true
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

export type UploadHistoryItem = {
    id: string;
    file: {
        originalFileName: string;
    } | null;
    uploader: {
        name: string;
    };
    uploadedAt: Date;
    status: "COMPLETED" | "FAILED";
    errorMsg: string | null;
    resolution: {
        initial: string;
        number: number;
        year: number;
    } | null;
}


export async function fetchUploadHistory(cursor: string | null): Promise<UploadHistoryItem[]> {
    await checkResourcePermission("upload", "read");

    const allowedStatuses = ["COMPLETED", "FAILED"] as const;

    const cursorParams = cursor ? {
        skip: 1,
        cursor: {
            id: cursor
        }
    } : {}

    const uploads = await prisma.resolutionUpload.findMany({
        ...cursorParams,
        where: {
            status: {
                in: allowedStatuses as Mutable<typeof allowedStatuses>
            }
        },
        orderBy: {
            uploadedAt: "desc"
        },
        take: 15,
        select: {
            id: true,
            file: {
                select: {
                    originalFileName: true
                }
            },
            uploader: {
                select: {
                    name: true
                }
            },
            uploadedAt: true,
            status: true,
            errorMsg: true,
            resolution: {
                select: {
                    initial: true,
                    number: true,
                    year: true
                }
            }
        }
    });

    return uploads.map(u => ({
        id: u.id,
        file: u.file,
        uploader: u.uploader,
        uploadedAt: u.uploadedAt,
        status: u.status as typeof allowedStatuses[number],
        errorMsg: u.errorMsg,
        resolution: u.resolution
    }));
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