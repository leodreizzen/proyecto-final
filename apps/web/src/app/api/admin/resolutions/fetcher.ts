import {AdminResolutionsReturnType} from "@/app/api/admin/resolutions/types";

export async function resolutionsFetcher({signal, pageParam, query}: {signal?: AbortSignal, pageParam: string | null, query?: string | null}): Promise<AdminResolutionsReturnType>{
    const searchParams = new URLSearchParams();
    if (pageParam !== null)
        searchParams.set("cursor", pageParam);
    if (query)
        searchParams.set("q", query);

    const fetchRes = await fetch(`/api/admin/resolutions?${searchParams.toString()}`, {signal});
    if(!fetchRes.ok) {
        throw new Error("Failed to fetch resolutions. Code: " + fetchRes.status);
    }
    return await fetchRes.json() as AdminResolutionsReturnType;
}