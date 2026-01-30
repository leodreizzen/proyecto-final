import {infiniteQueryOptions} from "@tanstack/react-query";
import {fetchSearchResolutionsById} from "@/app/api/resolutions/search/id/fetcher";
import {SearchFilters} from "@/lib/data/search";

export const resolutionKeys = {
    all: ['resolutions'] as const,
    byId: (filters: SearchFilters) => [...resolutionKeys.all, 'search', 'byId', filters] as const,
};

export const resolutionIdSearchQuery = (filters: SearchFilters)=> infiniteQueryOptions({
    queryKey: resolutionKeys.byId(filters),
    queryFn: ({ pageParam, signal }) => fetchSearchResolutionsById(filters, pageParam, signal),
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor,
    initialPageParam: undefined as string | undefined,
})