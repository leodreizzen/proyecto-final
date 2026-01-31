import { AdminMaintenanceTasksReturnType } from "./types";
import { MaintenanceTaskFilter } from "@/lib/data/maintenance";

export const getMaintenanceTasks = async ({
    pageParam = null,
    filter = "ACTIVE",
    query = null
}: {
    pageParam?: string | null;
    filter: MaintenanceTaskFilter;
    query?: string | null;
}): Promise<AdminMaintenanceTasksReturnType> => {
    const params = new URLSearchParams();
    if (pageParam) {
        params.append("cursor", pageParam);
    }
    params.append("filter", filter);
    if (query) {
        params.append("q", query);
    }

    const res = await fetch(`/api/admin/maintenance-tasks?${params.toString()}`);

    if (!res.ok) {
        throw new Error("Failed to fetch maintenance tasks");
    }

    return res.json();
};
