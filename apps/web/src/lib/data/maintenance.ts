import "server-only";
import { checkResourcePermission } from "@/lib/auth/data-authorization";
import prisma from "@/lib/prisma";
import {
    MaintenanceTaskFindManyArgs,
    MaintenanceTaskGetPayload,
    MaintenanceTaskWhereInput
} from "@repo/db/prisma/models";

export type MaintenanceTaskWithResolution = MaintenanceTaskGetPayload<{
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

export async function fetchMaintenanceTasks(
    cursor: string | null,
    filter: MaintenanceTaskFilter,
    query?: string | null
): Promise<MaintenanceTaskWithResolution[]> {
    await checkResourcePermission("maintenanceTask", "read");

    const cursorParams = cursor
        ? ({
              skip: 1,
              cursor: {
                  id: cursor,
              },
          } satisfies Partial<MaintenanceTaskFindManyArgs>)
        : {};

    let statusCondition: MaintenanceTaskWhereInput["status"] | undefined;

    switch (filter) {
        case "ACTIVE":
            statusCondition = { in: ["PENDING", "PROCESSING"] };
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

    const searchCondition: MaintenanceTaskWhereInput = query ? {
        resolution: {
            search: {
                search_id: {
                    contains: query.toUpperCase().trim()
                }
            }
        }
    } : {};

    console.log(searchCondition);

    const tasks = await prisma.maintenanceTask.findMany({
        ...cursorParams,
        where: {
            status: statusCondition,
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
        orderBy: {
            createdAt: "desc",
        },
        take: 20,
    });

    return tasks;
}

export async function countFailedTasks(): Promise<number> {
    await checkResourcePermission("maintenanceTask", "read");
    return prisma.maintenanceTask.count({
        where: {
            status: "FAILED",
        },
    });
}
