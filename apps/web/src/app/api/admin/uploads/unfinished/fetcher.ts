import {AdminUnfinishedUploadsReturnType} from "@/app/api/admin/uploads/unfinished/types";

export async function unfinishedUploadsFetcher({signal}: {signal?: AbortSignal} = {}): Promise<AdminUnfinishedUploadsReturnType>{
    const fetchRes = await fetch("/api/admin/uploads/unfinished", {signal});
    if(!fetchRes.ok) {
        throw new Error("Failed to fetch unfinished uploads. Code: " + fetchRes.status);
    }
    return await fetchRes.json() as AdminUnfinishedUploadsReturnType;
}