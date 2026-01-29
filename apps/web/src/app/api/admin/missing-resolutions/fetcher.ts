import {AdminMissingResolutionsReturnType} from "@/app/api/admin/missing-resolutions/types";

export async function missingResolutionsFetcher({pageParam, query, signal}: {
    pageParam?: unknown,
    query?: string | null,
    signal?: AbortSignal
} = {}): Promise<AdminMissingResolutionsReturnType> {
    const params = new URLSearchParams();
    if (pageParam) {
        params.set("cursor", String(pageParam));
    }
    if (query) {
        params.set("q", query);
    }

    const response = await fetch(`/api/admin/missing-resolutions?${params.toString()}`, {
        signal
    });

    if (!response.ok) {
        throw new Error("Failed to fetch missing resolutions");
    }

    return response.json();
}
