import {AdminUploadHistoryReturnType} from "@/app/api/admin/uploads/history/types";

export async function uploadHistoryFetcher({pageParam, signal}: {
    pageParam?: unknown,
    signal?: AbortSignal
} = {}): Promise<AdminUploadHistoryReturnType> {
    const params = new URLSearchParams();
    if (pageParam) {
        params.set("cursor", String(pageParam));
    }

    const response = await fetch(`/api/admin/uploads/history?${params.toString()}`, {
        signal
    });

    if (!response.ok) {
        throw new Error("Failed to fetch upload history");
    }

    return response.json();
}
