import {checkResourcePermission} from "@/lib/auth/data-authorization";
import {UploadWithFileAndUploader, UploadWithProgressAndFile} from "@/lib/definitions/uploads";
import {
    createResolutionUpload as createResolutionUploadMutation,
    deleteFailedUpload as deleteFailedUploadMutation
} from "@repo/jobs/resolutions/mutations";
import { getUploadProgress } from "@repo/jobs/resolutions/queue";
import prisma from "@/lib/prisma";
import {Mutable} from "@/lib/definitions/util";

export type UploadHistoryItem = {
    id: string;
    file: {
        originalFileName: string;
    } | null;
    uploader: {
        name: string;
        deleted: boolean;
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
    });

    const mappedUploads = uploads.map(upload => {
        let file = upload.file;
        if (upload.resolution) {
            file = upload.resolution.originalFile;
        }
        return {
            ...upload,
            file: file,
            resolution: upload.resolution,
        }
    });

    return await Promise.all(mappedUploads.map(async upload => {
            return {
                ...upload,
                progress: await getUploadProgress(upload.id) ?? 0
            }
        }
    ))
}

export async function fetchRecentFinishedUploads(): Promise<UploadWithFileAndUploader[]> {
    await checkResourcePermission("upload", "read");
    
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
            uploader: {
                select: {
                    name: true,
                    deletedAt: true
                }
            },
            resolution: {
                select: {
                    originalFile: true,
                    initial: true,
                    number: true,
                    year: true
                }
            }
        }
    });

    return uploads.map(upload => {
        let file = upload.file;
        if (upload.resolution) {
            file = upload.resolution.originalFile;
        }
        return {
            ...upload,
            uploader: {
                name: upload.uploader.name,
                deleted: !!upload.uploader.deletedAt
            },
            file,
        }
    });
}

export async function createResolutionUpload(fileKey: string, uploaderId: string) {
    return createResolutionUploadMutation(fileKey, uploaderId);
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
                    name: true,
                    deletedAt: true
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
        uploader: {
            name: u.uploader.name,
            deleted: !!u.uploader.deletedAt
        },
        uploadedAt: u.uploadedAt,
        status: u.status as "COMPLETED" | "FAILED",
        errorMsg: u.errorMsg,
        resolution: u.resolution
    }));
}

export async function deleteFailedUpload(uploadId: string) {
    await deleteFailedUploadMutation(uploadId);
}
