import { SearchFilters } from "@/lib/data/search";
import { SearchByIdReturnType } from "./types";

export async function fetchSearchResolutionsById(filters: SearchFilters, cursor?: string, signal?: AbortSignal): Promise<SearchByIdReturnType> {
    const params = new URLSearchParams();
    if (filters.initial) params.set("initial", filters.initial);
    if (filters.number) params.set("number", filters.number.toString());
    if (filters.year) params.set("year", filters.year.toString());
    
    if (cursor) params.set("cursor", cursor);

    const fetchRes = await fetch(`/api/resolutions/search/id?${params.toString()}`, {signal});
    if(!fetchRes.ok) {
        throw new Error("Failed to fetch resolutions. Code: " + fetchRes.status);
    }

    return fetchRes.json();
}
