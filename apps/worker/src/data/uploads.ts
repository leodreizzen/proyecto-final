import prisma, {TransactionPrismaClient} from "@repo/db/prisma";
import {ResolutionUpload} from "@repo/db/prisma/client";
import {UploadStatus} from "@repo/db/prisma/enums";

export async function setUploadStatus({uploadId, status, tx = prisma, errorMessage, ifStatus}: {
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

export async function fetchUploadWithFileToProcess(uploadId: string) {
    return prisma.resolutionUpload.findUnique({
        where: {
            id: uploadId,
            status: {
                in: ["PENDING", "PROCESSING"]
            }
        },
        include: {
            file: true,
        },
    });
}

export async function fetchOldUnfinishedUploads() {
    const oldDate = new Date();
    oldDate.setMinutes(oldDate.getMinutes() - 10);

    return prisma.resolutionUpload.findMany({
        where: {
            uploadedAt: {
                lt: oldDate,
            },
            status: {
                notIn: ["COMPLETED", "FAILED"]
            },
        },
    });
}