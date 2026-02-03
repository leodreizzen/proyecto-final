import prisma, {TransactionPrismaClient} from "@repo/db/prisma";

// Maintenance Queries
export async function findMaintenanceTask(id: string, tx: TransactionPrismaClient = prisma) {
    return tx.maintenanceTask.findUnique({
        where: {
            id, status: {
                in: ["PENDING", "PROCESSING"]
            }
        },
    })
}

export async function findOldUnfinishedMaintenanceTasks() {
    const oldDate = new Date();
    oldDate.setMinutes(oldDate.getMinutes() - 10);

    return prisma.maintenanceTask.findMany({
        where: {
            createdAt: {
                lt: oldDate,
            },
            status: {
                notIn: ["COMPLETED", "FAILED", "PARTIAL_FAILURE"]
            },
        },
    });
}

// Resolutions Queries
export async function findUploadWithFileToProcess(uploadId: string) {
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

export async function findOldUnfinishedUploads() {
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
