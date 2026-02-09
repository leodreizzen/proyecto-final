import {infiniteQueryOptions} from "@tanstack/react-query";
import {fetchSearchResolutionsById} from "@/app/api/resolutions/search/id/fetcher";
import {SearchFilters} from "@/lib/data/search";
import {fetchSearchResolutionsByKeywords} from "@/app/api/resolutions/search/keywords/fetcher";
import {fetchSearchResolutionsBySemantic} from "@/app/api/resolutions/search/semantic/fetcher";

export const resolutionKeys = {
    all: ['resolutions'] as const,
    byId: (filters: SearchFilters) => [...resolutionKeys.all, 'search', 'byId', filters] as const,
    semantic: (filters: SearchFilters) => [...resolutionKeys.all, 'search', 'semantic', filters] as const,
    keywords: (filters: SearchFilters) => [...resolutionKeys.all, 'search', 'keywords', filters] as const,
    fromFilters: (filters: SearchFilters) => {
        switch (filters.search_type) {
            case 'by_id':
                return resolutionKeys.byId(filters);
            case 'semantic':
                return resolutionKeys.semantic(filters);
            case 'keywords':
                return resolutionKeys.keywords(filters);
        }
    }
};

export const resolutionIdSearchQuery = (filters: SearchFilters) => {
    return infiniteQueryOptions({
        queryKey: resolutionKeys.fromFilters(filters),
        queryFn: filters.search_type === 'by_id' ? ({
                                                        pageParam,
                                                        signal
                                                    }) => fetchSearchResolutionsById(filters, pageParam, signal) :
            (filters.search_type === "semantic" ? ({
                                                       pageParam,
                                                       signal
                                                   }) => fetchSearchResolutionsBySemantic({
                search_type: "semantic",
                q: filters.q
            }, pageParam, signal) : ({
                                         pageParam,
                                         signal
                                     }) => fetchSearchResolutionsByKeywords({
                    search_type: "keywords", q: filters.q
                }, pageParam, signal
            )),
        getNextPageParam: (lastPage) => lastPage.meta.nextCursor,
        initialPageParam: undefined as string | undefined,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}