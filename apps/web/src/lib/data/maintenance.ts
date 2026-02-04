import "server-only";
import {checkResourcePermission} from "@/lib/auth/data-authorization";
import {
    deleteMaintenanceTasks as deleteMaintenanceTasksMutation
} from "@repo/jobs/maintenance/mutations";
import {
    Prisma
} from "@repo/db/prisma/client";
import prisma from "@/lib/prisma";
import {TaskMetadata, TaskMetadataSchema} from "@repo/jobs/maintenance/schemas";
import {JsonNull} from "@prisma/client/runtime/client";
import {retryMaintenanceTaskJob} from "@repo/jobs/maintenance/queue";
import {publishMaintenanceTaskUpdate} from "@repo/pubsub/publish/maintenance_tasks";

export type MaintenanceTaskWithResolution = Prisma.MaintenanceTaskGetPayload<{
    include: {
        resolution: {
            select: {
                initial: true;
                number: true;
                year: true;
            };
        };
    };
}>;

export type MaintenanceTaskFilter = "ALL" | "ACTIVE" | "COMPLETED" | "FAILED";


export async function fetchMaintenanceTasks({
                                                cursor,
                                                filter,
                                                query,
                                                limit = 20,
                                                resolutionId
                                            }: {
    cursor: string | null,
    filter: MaintenanceTaskFilter,
    query?: string | null,
    limit?: number | null,
    resolutionId?: string
}): Promise<MaintenanceTaskWithResolution[]> {
    await checkResourcePermission("maintenanceTask", "read");

    const cursorParams = cursor
        ? ({
            skip: 1,
            cursor: {
                id: cursor,
            },
        } satisfies Partial<Prisma.MaintenanceTaskFindManyArgs>)
        : {};

    let statusCondition: Prisma.MaintenanceTaskWhereInput["status"] | undefined;

    switch (filter) {
        case "ACTIVE":
            statusCondition = {in: ["PENDING", "PROCESSING"]};
            break;
        case "COMPLETED":
            statusCondition = "COMPLETED";
            break;
        case "FAILED":
            statusCondition = {in: ["FAILED", "PARTIAL_FAILURE"]};
            break;
        case "ALL":
            statusCondition = undefined;
            break;
    }

    const searchCondition: Prisma.MaintenanceTaskWhereInput = query ? {
        resolution: {
            search: {
                search_id: {
                    contains: query.toUpperCase().trim()
                }
            }
        }
    } : {};

    return prisma.maintenanceTask.findMany({
        ...cursorParams,
        where: {
            status: statusCondition,
            resolutionId: resolutionId ?? undefined,
            ...searchCondition
        },
        include: {
            resolution: {
                select: {
                    initial: true,
                    number: true,
                    year: true,
                },
            },
        },
        orderBy: [
            {
                order: "asc"
            },
            {
                createdAt: "asc"
            }
        ],
        take: limit ?? undefined,
    });
}

export async function countFailedTasks(): Promise<number> {
    await checkResourcePermission("maintenanceTask", "read");
    return prisma.maintenanceTask.count({
        where: {
            status: "FAILED",
        },
    });
}


export async function deleteMaintenanceTasksById(id: string[]): Promise<void> {
    await checkResourcePermission("maintenanceTask", "delete");
    return deleteMaintenanceTasksMutation(id);
}

export async function retryMaintenanceTask(id: string): Promise<void> {
    await checkResourcePermission("maintenanceTask", "retry");

    const task = await prisma.$transaction(async tx => {
        const task = await tx.maintenanceTask.findUnique({
            where: {
                id: id
            }
        });

        if (!task) {
            throw new Error(`Maintenance task with ID ${id} not found`);
        }

        let payload = task.payload;

        if (task.type === "PROCESS_ADVANCED_CHANGES") {
            const payloadParseRes = TaskMetadataSchema.safeParse(payload);
            if (!payloadParseRes.success) {
                payload = {
                    completedChanges: [],
                    failedChanges: []
                } satisfies TaskMetadata
            } else {
                payload = {
                    ...payloadParseRes.data,
                    failedChanges: []
                } satisfies TaskMetadata
            }
        }


        return await tx.maintenanceTask.update({
            where: {
                id: id
            },
            data: {
                status: "PENDING",
                payload: payload ?? JsonNull,
                errorMsg: null
            }
        });
    })

    await retryMaintenanceTaskJob(task.id, task.resolutionId, task.type);

    await publishMaintenanceTaskUpdate(task.id, ["status", "errorMsg"]);
}