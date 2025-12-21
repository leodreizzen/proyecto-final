"use client"
import {KpiHeader} from "./kpi-header"
import {Toolbar} from "./toolbar"
import {ResolutionsTable} from "./resolutions-table"
import {StatusPanel} from "./status-panel"
import {UploadWithFile, UploadWithProgressAndFile} from "@/lib/definitions/uploads";
import {ResolutionCounts, ResolutionWithStatus} from "@/lib/definitions/resolutions";
import {useEffect} from "react";
import {useQuery} from "@tanstack/react-query";
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
                                    resCounts: _resCounts
                                }: {
    resolutions: ResolutionWithStatus[],
    pendingUploads: UploadWithProgressAndFile[],
    recentFinishedUploads: UploadWithFile[],
    resCounts: ResolutionCounts
}) {
    const {data: pendingUploads} = useQuery({
        ...pendingUploadsQuery,
        initialData: _pendingUploads
    })

    const {data: resolutions} = useQuery({
        ...resolutionsQuery,
        initialData: _resolutions
    });

    const {data: recentFinishedUploads} = useQuery({
        ...recentFinishedUploadsQuery,
        initialData: _recentFinishedUploads
    });

    const {data: resCounts} = useQuery({
        ...resolutionCountsQuery,
        initialData: _resCounts
    });

    useEffect(() => {
        return mountDashboardEventStream();
    }, []);

    const stats = {
        total: resCounts.total,
        inQueue: pendingUploads.length,
        missing: resCounts.missingRef,
        inconsistent: resCounts.inconsistent,
    }

    return (
        <div className="flex flex-col xl:flex-row h-full">
            {/* Main content - Central column */}
            <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 overflow-auto">
                <KpiHeader stats={stats}/>
                <Toolbar/>
                <ResolutionsTable resolutions={resolutions}/>
            </div>

            {/* Status panel - Right column */}
            <div className="h-1/2 xl:h-auto xl:w-80 2xl:w-96 border-t xl:border-t-0 xl:border-l border-border bg-card/50">
                <StatusPanel unfinished={pendingUploads} recent={recentFinishedUploads}/>
            </div>
        </div>
    )
}
