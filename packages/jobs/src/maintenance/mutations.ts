import prisma, {TransactionPrismaClient} from "@repo/db/prisma";
import {MaintenanceTask} from "@repo/db/prisma/client";
import {MaintenanceTaskStatus} from "@repo/db/prisma/enums";
import {EvaluateImpactPayload, EvaluateImpactPayloadSchema, TaskMetadataSchema} from "./schemas";

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
        ...(ifStatus !== undefined ? {status: {in: ifStatus}} : {}),
        deletedAt: null
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
        ...(ifStatus !== undefined ? {status: {in: ifStatus}} : {}),
        deletedAt: null
    };

    await tx.maintenanceTask.update({
        where: whereClause,
        data: {
            payload: metadata
        }
    });
}

type CreateTaskResult = {
    created: false,
    id: string,
} | {
    created: true,
    id: string,
    deletedTaskIds: string[]
}

type ImpactCutoff = NonNullable<EvaluateImpactPayload["cutoff"]>;

function compareCutoffs(
    a: ImpactCutoff,
    b: ImpactCutoff,
    idMap: Map<string, { initial: string, number: number, year: number }>
): number {
    const dateDiff = a.date.getTime() - b.date.getTime();
    if (dateDiff !== 0) {
        return dateDiff;
    }

    const aRes = idMap.get(a.resolutionId);
    const bRes = idMap.get(b.resolutionId);

    if (!aRes) {
        if (!bRes) {
            return 0;
        } else {
            return -1; // if bRes has id, consider it greater
        }
    } else {
        if (!bRes) {
            return 1;  // if aRes has id, consider it greater
        }
    }

    const yearDiff = aRes.year - bRes.year;
    if (yearDiff !== 0) {
        return yearDiff;
    }

    const numberDiff = aRes.number - bRes.number;
    if (numberDiff !== 0) {
        return numberDiff;
    }

    return aRes.initial.localeCompare(bRes.initial);
}

export async function removeOldImpactEvaluationTasks(resolutionId: string, tx: TransactionPrismaClient = prisma, currentPayload: EvaluateImpactPayload) {
    const oldTasks = await tx.maintenanceTask.findMany({
        where: {
            type: "EVALUATE_IMPACT",
            resolutionId,
            deletedAt: null,
            status: {
                in: ["COMPLETED", "FAILED"]
            }
        }
    });

    const failedTasks = oldTasks.filter(t => t.status === "FAILED");
    const payloadsToPreserve = failedTasks.map(t => {
        const parseRes = EvaluateImpactPayloadSchema.safeParse(t.payload);
        return parseRes.success ? parseRes.data : null;
    });

    const cuttoffResolutions = await tx.resolution.findMany({
        where: {
            id: {
                in: payloadsToPreserve.map(p => p?.cutoff?.resolutionId).filter((id): id is string => typeof id === "string"),
            }
        }, select: {
            id: true,
            initial: true,
            number: true,
            year: true
        }
    });

    const idMap = new Map<string, { initial: string, number: number, year: number }>();

    for (const res of cuttoffResolutions) {
        idMap.set(res.id, {initial: res.initial, number: res.number, year: res.year});
    }

    const minCuttoff = payloadsToPreserve.reduce((min, p) => {
        if (!p || !p.cutoff)
            return min;

        if (!min || compareCutoffs(p.cutoff, min, idMap) < 0) {
            return p.cutoff;
        } else {
            return min;
        }

    }, currentPayload.cutoff);

    await tx.maintenanceTask.updateMany({
        where: {
            id: {
                in: oldTasks.map((t) => t.id),
            }
        },
        data: {
            deletedAt: new Date()
        }
    })

    if (oldTasks.length > 0)
        console.log("Removed old impact evaluation tasks for resolution", resolutionId, "preserved cutoff:", minCuttoff, "deleted task ids:", oldTasks.map(t => t.id));

    return {
        newPayload: minCuttoff ? {
            ...currentPayload,
            cutoff: minCuttoff
        } : currentPayload,
        deletedTaskIds: oldTasks.map(t => t.id)
    }
}

export async function upsertImpactEvaluationTask(resolutionId: string, eventId: string, payload: EvaluateImpactPayload, tx?: TransactionPrismaClient): Promise<CreateTaskResult> {
    const txFn = async (tx: TransactionPrismaClient) => {
        const existing = await tx.maintenanceTask.findUnique({
            where: {
                resolutionId_type_triggerEventId: {
                    resolutionId,
                    triggerEventId: eventId,
                    type: 'EVALUATE_IMPACT'
                },
                deletedAt: null
            }
        });

        if (existing) {
            return {
                created: false,
                id: existing.id
            } satisfies CreateTaskResult
        } else {
            const {newPayload, deletedTaskIds} = await removeOldImpactEvaluationTasks(resolutionId, tx, payload);

            const task = await tx.maintenanceTask.create({
                data: {
                    type: 'EVALUATE_IMPACT',
                    resolutionId: resolutionId,
                    status: 'PENDING',
                    triggerEventId: eventId,
                    payload: newPayload
                }
            });
            return {
                created: true,
                id: task.id,
                deletedTaskIds: deletedTaskIds
            } satisfies CreateTaskResult
        }
    }
    return tx ? txFn(tx) : prisma.$transaction(txFn);
}

export async function upsertEmbeddingsTask(resolutionId: string, eventId: string, depth: number, tx?: TransactionPrismaClient): Promise<CreateTaskResult> {
    const txFn = async (tx: TransactionPrismaClient) => {
        const existing = await tx.maintenanceTask.findUnique({
            where: {
                resolutionId_type_triggerEventId: {
                    resolutionId,
                    triggerEventId: eventId,
                    type: 'CALCULATE_EMBEDDINGS'
                },
                deletedAt: null
            }
        });
        if (existing) {
            return {
                created: false,
                id: existing.id
            } satisfies CreateTaskResult;
        } else {

            const oldTasks = await tx.maintenanceTask.findMany({
                where: {
                    resolutionId,
                    type: 'CALCULATE_EMBEDDINGS',
                    deletedAt: null,
                    status: {
                        in: ['COMPLETED', 'FAILED']
                    }
                }
            });

            await tx.maintenanceTask.updateMany({
                where: {
                    id: {
                        in: oldTasks.map(t => t.id)
                    }
                },
                data: {
                    deletedAt: new Date()
                }
            });

            const deletedTaskIds = oldTasks.map(t => t.id);

            if (deletedTaskIds.length > 0)
                console.log("Removed old embeddings tasks for resolution", resolutionId, "deleted task ids:", deletedTaskIds);

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
                id: task.id,
                deletedTaskIds
            } satisfies CreateTaskResult;
        }
    }

    return tx ? txFn(tx) : prisma.$transaction(txFn);
}

export async function upsertAdvancedChangesTask(resolutionId: string, eventId: string, depth: number, tx?: TransactionPrismaClient): Promise<CreateTaskResult> {
    const txFn = async (tx: TransactionPrismaClient) => {
        const existing = await tx.maintenanceTask.findUnique({
            where: {
                resolutionId_type_triggerEventId: {
                    resolutionId,
                    triggerEventId: eventId,
                    type: 'PROCESS_ADVANCED_CHANGES'
                },
                deletedAt: null
            }
        });
        if (existing) {
            return {
                created: false,
                id: existing.id
            } satisfies CreateTaskResult;
        } else {
            const oldTasks = await tx.maintenanceTask.findMany({
                where: {
                    resolutionId,
                    type: 'PROCESS_ADVANCED_CHANGES',
                    deletedAt: null,
                    status: {
                        in: ['COMPLETED', 'FAILED']
                    }
                }
            });

            await tx.maintenanceTask.updateMany({
                where: {
                    id: {
                        in: oldTasks.map(t => t.id)
                    }
                },
                data: {
                    deletedAt: new Date()
                }
            });

            const deletedTaskIds = oldTasks.map(t => t.id);

            if (oldTasks.length > 0)
                console.log("Removed old advanced changes tasks for resolution", resolutionId, "deleted task ids:", deletedTaskIds);

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
                id: task.id,
                deletedTaskIds
            } satisfies CreateTaskResult
        }
    }
    return tx ? txFn(tx) : prisma.$transaction(txFn);
}

