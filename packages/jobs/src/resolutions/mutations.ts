import prisma, {TransactionPrismaClient} from "@repo/db/prisma";
import {ResolutionUpload} from "@repo/db/prisma/client";
import {UploadStatus} from "@repo/db/prisma/enums";

if (!process.env.S3_INTERNAL_BUCKET_NAME) {
    throw new Error("S3_INTERNAL_BUCKET_NAME is not set in environment variables");
}
const RESOLUTION_UPLOAD_BUCKET = process.env.S3_INTERNAL_BUCKET_NAME;

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

export async function updateUploadStatus({uploadId, status, tx = prisma, errorMessage, ifStatus}: {
    uploadId: ResolutionUpload["id"],
    status: UploadStatus,
    tx?: TransactionPrismaClient,
    ifStatus?: UploadStatus[],
} & ({ status: "FAILED", errorMessage: string } | {
    status: Exclude<UploadStatus, "FAILED">,
    errorMessage?: never
})) {

    const whereClause = {
        id: uploadId,
        ...(ifStatus !== undefined ? {status: {in: ifStatus}} : {})
    };

    await tx.resolutionUpload.update({
        where: whereClause,
        data: {
            status,
            errorMsg: errorMessage
        }
    });
}