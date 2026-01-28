"use client"
import {KpiHeader} from "./kpi-header"
import {Toolbar} from "./toolbar"
import {ResolutionsTable, ResolutionsTableHandle} from "./resolutions-table"
import {StatusPanel} from "./status-panel"
import {UploadWithFile, UploadWithProgressAndFile} from "@/lib/definitions/uploads";
import {ResolutionCounts, ResolutionWithStatus} from "@/lib/definitions/resolutions";
import {useEffect, useMemo, useRef, useState} from "react";
import {useInfiniteQuery, useQuery, keepPreviousData} from "@tanstack/react-query";

import {
    pendingUploadsQuery,
    recentFinishedUploadsQuery,
    resolutionCountsQuery,
    resolutionsQuery,
} from "@/lib/queries/admin/queries";
import {mountDashboardEventStream} from "@/lib/queries/admin/event-handler";

export function ResolutionsView({
                                    resolutions: _resolutions,
                                    pendingUploads: _pendingUploads,
                                    recentFinishedUploads: _recentFinishedUploads,
                                    resCounts: _resCounts,
                                    initialSearch = ""
                                }: {
    resolutions: ResolutionWithStatus[],
    pendingUploads: UploadWithProgressAndFile[],
    recentFinishedUploads: UploadWithFile[],
    resCounts: ResolutionCounts,
    initialSearch?: string
}) {
    const [search, setSearch] = useState(initialSearch);
    const resolutionsTableRef = useRef<ResolutionsTableHandle>(null);

    function handleSearch(value: string) {
        setSearch(value);
        const url = new URL(window.location.href);
        if (value) {
            url.searchParams.set("q", value);
        } else {
            url.searchParams.delete("q");
        }
        window.history.replaceState(null, "", url.toString());
    }

    const {data: pendingUploads} = useQuery({
        ...pendingUploadsQuery,
        initialData: _pendingUploads
    })

    const {data: resolutionsData, fetchNextPage: fetchNextResolutionsPage, isPlaceholderData: resolutionsIsPlaceholder} = useInfiniteQuery({
        ...resolutionsQuery(search),
        initialData: () => (search === initialSearch) ? {pages: [_resolutions], pageParams: [null]} : undefined,
        placeholderData: keepPreviousData,
        initialDataUpdatedAt: search !== initialSearch ? 0 : undefined
    });

    const {data: recentFinishedUploads} = useQuery({
        ...recentFinishedUploadsQuery,
        initialData: _recentFinishedUploads
    });

    const {data: resCounts} = useQuery({
        ...resolutionCountsQuery,
        initialData: _resCounts
    });

    const resolutions = useMemo(() => resolutionsData?.pages?.flat() ?? [], [resolutionsData]);

    const lastScrolledSearch = useRef(initialSearch);

    // scroll to top on new search, but only after data arrives
    useEffect(() => {
        if (!resolutionsIsPlaceholder && lastScrolledSearch.current !== search){
            resolutionsTableRef.current?.scrollToTop();
            lastScrolledSearch.current = search;
        }
    }, [resolutionsIsPlaceholder, search]);

    useEffect(() => {
        return mountDashboardEventStream();
    }, []);

    const stats = {
        total: resCounts.total,
        inQueue: pendingUploads.length,
        missing: resCounts.missingRef,
        inconsistent: resCounts.inconsistent,
    }

    function handleResolutionsRefetch() {
        fetchNextResolutionsPage({cancelRefetch: false});
    }

    return (
        <div className="flex flex-col xl:flex-row h-full">
            {/* Main content - Central column */}
            <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 overflow-auto">
                <KpiHeader stats={stats}/>
                <Toolbar initialSearchQuery={initialSearch} onSearch={handleSearch}/>
                <ResolutionsTable resolutions={resolutions} fetchNextPage={handleResolutionsRefetch} ref={resolutionsTableRef}/>
            </div>

            {/* Status panel - Right column */}
            <div
                className="h-1/2 xl:h-auto xl:w-80 2xl:w-96 border-t xl:border-t-0 xl:border-l border-border bg-card/50">
                <StatusPanel unfinished={pendingUploads} recent={recentFinishedUploads}/>
            </div>
        </div>
    )
}