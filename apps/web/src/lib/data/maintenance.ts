import "server-only";
import {checkResourcePermission} from "@/lib/auth/data-authorization";
import {
    deleteMaintenanceTasks as deleteMaintenanceTasksMutation
} from "@repo/jobs/maintenance/mutations";
import {
    Prisma
} from "@repo/db/prisma/client";
import prisma from "@/lib/prisma";

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
            statusCondition = "FAILED";
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