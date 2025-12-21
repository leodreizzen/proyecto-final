import {resolutionsFetcher} from "@/app/api/admin/resolutions/fetcher";
import {queryOptions} from "@tanstack/react-query";
import {recentlyFinisheddUploadsFetcher} from "@/app/api/admin/uploads/recently-finished/fetcher";
import {unfinishedUploadsFetcher} from "@/app/api/admin/uploads/unfinished/fetcher";

export const resolutionsQuery = queryOptions({
    queryKey: ["resolutions"],
    queryFn: resolutionsFetcher
})

export const recentFinishedUploadsQuery = queryOptions({
    queryKey: ['recentFinishedUploads'],
    queryFn: recentlyFinisheddUploadsFetcher,
});

export const pendingUploadsQuery = queryOptions({
    queryKey: ['pendingUploads'],
    queryFn: unfinishedUploadsFetcher,
});