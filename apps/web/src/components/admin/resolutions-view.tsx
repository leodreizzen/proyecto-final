"use client"
import {KpiHeader} from "./kpi-header"
import {Toolbar} from "./toolbar"
import {ResolutionsTable} from "./resolutions-table"
import {StatusPanel} from "./status-panel"
import {UploadWithFile, UploadWithProgressAndFile} from "@/lib/definitions/uploads";
import {ResolutionWithStatus} from "@/lib/definitions/resolutions";
import {useEffect} from "react";
import {AdminDashboardEvent} from "@/app/api/events/admin/dashboard/route";
import {useQuery} from "@tanstack/react-query";
import {unfinishedUploadsFetcher} from "@/app/api/admin/uploads/unfinished/fetcher";
import {queryClient} from "@/lib/actions/queryClient";
import {AdminUnfinishedUploadsReturnType} from "@/app/api/admin/uploads/unfinished/types";

export function ResolutionsView({resolutions, pendingUploads: _pendingUploads, recentFinishedUploads, resCount}: {
    resolutions: ResolutionWithStatus[],
    pendingUploads: UploadWithProgressAndFile[],
    recentFinishedUploads: UploadWithFile[],
    resCount: number
}) {
    const {data: pendingUploads} = useQuery({
        queryKey: ['pendingUploads'],
        initialData: _pendingUploads,
        queryFn: unfinishedUploadsFetcher
    })
    useEffect(() => {
        const eventSource = new EventSource('/api/events/admin/dashboard');
        eventSource.onmessage = async (event) => {
            const eventData = JSON.parse(event.data) as AdminDashboardEvent;
            if (eventData.scope === "UPLOADS_SPECIFIC") {
                switch (eventData.data.type) {
                    case "PROGRESS": {
                        const uploadId = eventData.params.id;
                        const progress = eventData.data.progress;

                        queryClient.setQueryData<AdminUnfinishedUploadsReturnType>(["pendingUploads"], (oldData) => {
                            if (!oldData) return oldData;
                            return oldData.map((upload) => {
                                if (upload.id === uploadId) {
                                    return {
                                        ...upload,
                                        progress: progress
                                    };
                                } else
                                    return upload;
                            })
                        });
                        break;
                    }
                    case "STATUS": {
                        const uploadId = eventData.params.id;
                        const status = eventData.data.status;

                        queryClient.setQueryData<AdminUnfinishedUploadsReturnType>(["pendingUploads"], (oldData) => {
                            if (!oldData) return oldData;
                            if(status === "COMPLETED" || status === "FAILED") {
                                return oldData.filter((upload) => upload.id !== uploadId);
                                // TODO add to recent finished uploads list
                            }
                            return oldData.map((upload) => {
                                if (upload.id === uploadId) {
                                    return {
                                        ...upload,
                                        status
                                    };
                                } else
                                    return upload;
                            })
                        });
                        break;
                    }
                }
            }
            else if (eventData.scope === "UPLOADS_GLOBAL") {
                await queryClient.invalidateQueries({queryKey: ["pendingUploads"]});
            }

            return () => {
                eventSource.close();
            }
        }
    }, []);

    const stats = {
        total: resCount,
        inQueue: pendingUploads.length,
        missing: resolutions.filter((r) => r.status !== "ok").length, //TODO
        inconsistent: resolutions.filter((r) => r.status === "inconsistent").length, //TODO
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
            <div className="xl:w-80 2xl:w-96 border-t xl:border-t-0 xl:border-l border-border bg-card/50">
                <StatusPanel unfinished={pendingUploads} recent={recentFinishedUploads}/>
            </div>
        </div>
    )
}
