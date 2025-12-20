import {AdminRecentlyFinishedUploadsReturnType} from "@/app/api/admin/uploads/recently-finished/types";

export async function recentlyFinisheddUploadsFetcher({signal}: {signal?: AbortSignal} = {}): Promise<AdminRecentlyFinishedUploadsReturnType>{
    const fetchRes = await fetch("/api/admin/uploads/recently-finished", {signal});
    if(!fetchRes.ok) {
        throw new Error("Failed to fetch recently finished uploads. Code: " + fetchRes.status);
    }
    return await fetchRes.json() as AdminRecentlyFinishedUploadsReturnType;
}