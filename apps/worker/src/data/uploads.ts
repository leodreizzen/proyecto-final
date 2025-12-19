import prisma, {TransactionPrismaClient} from "@repo/db/prisma";
import {ResolutionUpload} from "@repo/db/prisma/client";
import {UploadStatus} from "@repo/db/prisma/enums";

export async function setUploadStatus({upload, status, tx = prisma, errorMessage}: {
    upload: ResolutionUpload,
    status: UploadStatus,
    tx?: TransactionPrismaClient
} & ({ status: "FAILED", errorMessage: string } | {
    status: Exclude<UploadStatus, "FAILED">,
    errorMessage?: never
})) {
    await tx.resolutionUpload.update({
        where: {
            id: upload.id,
        },
        data: {
            status,
            errorMsg: errorMessage
        }
    });
}

export async function fetchUploadWithFile(uploadId: string) {
    return prisma.resolutionUpload.findUnique({
        where: {
            id: uploadId,
        },
        include: {
            file: true,
        },
    });
}