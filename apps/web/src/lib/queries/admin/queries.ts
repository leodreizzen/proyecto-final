import {AdminResolutionsReturnType} from "@/app/api/admin/resolutions/types";
import {resolutionsFetcher} from "@/app/api/admin/resolutions/fetcher";
import {infiniteQueryOptions, InfiniteData, queryOptions} from "@tanstack/react-query";
import {recentlyFinisheddUploadsFetcher} from "@/app/api/admin/uploads/recently-finished/fetcher";
import {unfinishedUploadsFetcher} from "@/app/api/admin/uploads/unfinished/fetcher";
import {resolutionCountsFetcher} from "@/app/api/admin/resolutions/counts/fetcher";

export const resolutionKeys = {
    all: ['resolutions'] as const,
    list: (query?: string | null) => [...resolutionKeys.all, 'list', { query }] as const,
    counts: () => [...resolutionKeys.all, 'counts'] as const,
    details: (id: string) => [...resolutionKeys.all, 'details', id] as const,
};

export const uploadKeys = {
    all: ['uploads'] as const,
    recentFinished: () => [...uploadKeys.all, 'recentFinished'] as const,
    unfinished: () => [...uploadKeys.all, 'unfinished'] as const,
}

export const resolutionsQuery = (query?: string | null) => infiniteQueryOptions<AdminResolutionsReturnType, Error, InfiniteData<AdminResolutionsReturnType>, readonly ["resolutions", "list", { readonly query: string | null | undefined; }], string | null>({
    queryKey: resolutionKeys.list(query),
    queryFn: ({ signal, pageParam }) => resolutionsFetcher({ signal, pageParam, query }),
    initialPageParam: null,
    getNextPageParam: (data) => {
        if(data.length > 0){
            return data[data.length - 1]!.id;
        } else
            return null
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
})

export const recentFinishedUploadsQuery = queryOptions({
    queryKey: uploadKeys.recentFinished(),
    queryFn: recentlyFinisheddUploadsFetcher,
});

export const pendingUploadsQuery = queryOptions({
    queryKey: uploadKeys.unfinished(),
    queryFn: unfinishedUploadsFetcher,
});

export const resolutionCountsQuery = queryOptions({
    queryKey: resolutionKeys.counts(),
    queryFn: resolutionCountsFetcher,
});