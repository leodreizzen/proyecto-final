import { SearchFilters } from "@/lib/data/search";
import {SearchResolutionBySemanticResult} from "@/app/api/resolutions/search/semantic/types";

export async function fetchSearchResolutionsBySemantic(filters: SearchFilters & {search_type: "semantic"}, cursor?: string, signal?: AbortSignal): Promise<SearchResolutionBySemanticResult> {
    const params = new URLSearchParams();
    params.set("q", filters.q)
    if (cursor) params.set("cursor", cursor);

    const fetchRes = await fetch(`/api/resolutions/search/semantic?${params.toString()}`, {signal});
    if(!fetchRes.ok) {
        throw new Error("Failed to fetch resolutions. Code: " + fetchRes.status);
    }

    return fetchRes.json();
}
