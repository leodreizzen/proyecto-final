import {AdminResolutionsCountsReturnType} from "@/app/api/admin/resolutions/counts/types";

export async function resolutionCountsFetcher({signal}: {signal?: AbortSignal} = {}): Promise<AdminResolutionsCountsReturnType>{
    const fetchRes = await fetch("/api/admin/resolutions/counts", {signal});
    if(!fetchRes.ok) {
        throw new Error("Failed to fetch resolution counts. Code: " + fetchRes.status);
    }
    return await fetchRes.json() as AdminResolutionsCountsReturnType;
}