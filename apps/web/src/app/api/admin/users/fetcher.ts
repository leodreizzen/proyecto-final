import {AdminUsersReturnType} from "@/app/api/admin/users/types";

export async function usersFetcher({pageParam, query, signal}: {
    pageParam?: unknown,
    query?: string | null,
    signal?: AbortSignal
} = {}): Promise<AdminUsersReturnType> {
    const params = new URLSearchParams();
    if (pageParam) {
        params.set("cursor", String(pageParam));
    }
    if (query) {
        params.set("q", query);
    }

    const response = await fetch(`/api/admin/users?${params.toString()}`, {
        signal
    });

    if (!response.ok) {
        throw new Error("Failed to fetch users");
    }

    return response.json();
}
