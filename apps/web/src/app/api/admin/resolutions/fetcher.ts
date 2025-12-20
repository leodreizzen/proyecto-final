import {AdminResolutionsReturnType} from "@/app/api/admin/resolutions/types";

export async function resolutionsFetcher({signal}: {signal?: AbortSignal} = {}): Promise<AdminResolutionsReturnType>{
    const fetchRes = await fetch("/api/admin/resolutions", {signal});
    if(!fetchRes.ok) {
        throw new Error("Failed to fetch resolutions. Code: " + fetchRes.status);
    }
    return await fetchRes.json() as AdminResolutionsReturnType;
}