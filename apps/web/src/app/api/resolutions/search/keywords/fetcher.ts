import { SearchFilters } from "@/lib/data/search";
import {SearchResolutionByKeywordsResult} from "@/app/api/resolutions/search/keywords/types";

export async function fetchSearchResolutionsByKeywords(filters: SearchFilters & {search_type: "keywords"}, cursor?: string, signal?: AbortSignal): Promise<SearchResolutionByKeywordsResult> {
    const params = new URLSearchParams();
    params.set("q", filters.q)
    if (cursor) params.set("cursor", cursor);

    const fetchRes = await fetch(`/api/resolutions/search/keywords?${params.toString()}`, {signal});
    if(!fetchRes.ok) {
        throw new Error("Failed to fetch resolutions. Code: " + fetchRes.status);
    }

    return fetchRes.json();
}
