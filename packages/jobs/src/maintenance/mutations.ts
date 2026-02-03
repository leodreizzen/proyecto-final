import prisma, {TransactionPrismaClient} from "@repo/db/prisma";
import {MaintenanceTask} from "@repo/db/prisma/client";
import {MaintenanceTaskStatus} from "@repo/db/prisma/enums";

export async function deleteMaintenanceTasks(id: string[]): Promise<void> {
    await prisma.maintenanceTask.deleteMany({
        where: {
            id: {in: id},
        },
    });
}

export async function updateMaintenanceTaskStatus({taskId, status, tx = prisma, errorMessage, ifStatus}: {
    taskId: MaintenanceTask["id"],
    status: MaintenanceTaskStatus,
    tx?: TransactionPrismaClient,
    ifStatus?: MaintenanceTaskStatus[],
} & ({ status: "FAILED", errorMessage: string } | {
    status: Exclude<MaintenanceTaskStatus, "FAILED">,
    errorMessage?: never
})) {

    const whereClause = {
        id: taskId,
        ...(ifStatus !== undefined ? {status: {in: ifStatus}} : {})
    };

    await tx.maintenanceTask.update({
        where: whereClause,
        data: {
            status,
            errorMsg: errorMessage
        }
    });
}

export async function updateMaintenanceTaskMetadata({taskId, metadata, tx = prisma, ifStatus}: {
    taskId: MaintenanceTask["id"],
    metadata: object, // TODO define type
    tx?: TransactionPrismaClient,
    ifStatus?: MaintenanceTaskStatus[],
}) {

    const whereClause = {
        id: taskId,
        ...(ifStatus !== undefined ? {status: {in: ifStatus}} : {})
    };

    await tx.maintenanceTask.update({
        where: whereClause,
        data: {
            payload: metadata
        }
    });
}


export async function upsertImpactEvaluationTask(resolutionId: string, eventId: string, tx: TransactionPrismaClient = prisma) {
    const existing = await tx.maintenanceTask.findUnique({
        where: {
            resolutionId_type_triggerEventId: {
                resolutionId,
                triggerEventId: eventId,
                type: 'EVALUATE_IMPACT'
            }
        }
    });

    if (existing) {
        return {
            created: false,
            id: existing.id
        }
    }
    else {
        const task = await tx.maintenanceTask.create({
            data: {
                type: 'EVALUATE_IMPACT',
                resolutionId: resolutionId,
                status: 'PENDING',
                triggerEventId: eventId,
            }
        });
        return {
            created: true,
            id: task.id
        };
    }
}

export async function upsertEmbeddingsTask(resolutionId: string, eventId: string, depth: number, tx: TransactionPrismaClient = prisma) {

    const existing = await tx.maintenanceTask.findUnique({
        where: {
            resolutionId_type_triggerEventId: {
                resolutionId,
                triggerEventId: eventId,
                type: 'CALCULATE_EMBEDDINGS'
            }
        }
    });
    if (existing) {
        return {
            created: false,
            id: existing.id
        };
    } else {
        const task = await tx.maintenanceTask.create({
            data: {
                type: 'CALCULATE_EMBEDDINGS',
                resolutionId: resolutionId,
                status: 'PENDING',
                triggerEventId: eventId,
                order: depth
            }
        });
        return {
            created: true,
            id: task.id
        };
    }
}

export async function upsertAdvancedChangesTask(resolutionId: string, eventId: string, depth: number, tx: TransactionPrismaClient = prisma) {
    const existing = await tx.maintenanceTask.findUnique({
        where: {
            resolutionId_type_triggerEventId: {
                resolutionId,
                triggerEventId: eventId,
                type: 'PROCESS_ADVANCED_CHANGES'
            }
        }
    });
    if (existing) {
        return {
            created: false,
            id: existing.id
        };
    } else {
        const task = await tx.maintenanceTask.create({
            data: {
                type: 'PROCESS_ADVANCED_CHANGES',
                resolutionId: resolutionId,
                status: 'PENDING',
                triggerEventId: eventId,
                order: depth,
            }
        });
        return {
            created: true,
            id: task.id
        }
    }
}

