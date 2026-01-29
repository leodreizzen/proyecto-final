"use client"

import {useEffect, useMemo} from "react";
import {useInfiniteQuery, useQuery} from "@tanstack/react-query";
import {mountDashboardEventStream} from "@/lib/queries/admin/event-handler";
import {UploadHistoryItem} from "@/lib/data/uploads";
import {pendingUploadsQuery, uploadHistoryQuery} from "@/lib/queries/admin/queries";
import {UploadWithProgressAndFile} from "@/lib/definitions/uploads";
import {UploadHistoryTable} from "@/components/admin/upload-history-table";
import {ProcessingQueue} from "@/components/admin/processing-queue";

export function HistoryView({
                                initialHistory,
                                initialPendingUploads
                            }: {
    initialHistory: UploadHistoryItem[],
    initialPendingUploads: UploadWithProgressAndFile[]
}) {
    
    const {data: historyData, fetchNextPage} = useInfiniteQuery({
        ...uploadHistoryQuery,
        initialData: {pages: [initialHistory], pageParams: [null]},
    });

    const {data: pendingUploads} = useQuery({
        ...pendingUploadsQuery,
        initialData: initialPendingUploads
    })

    const history = useMemo(() => historyData?.pages?.flat() ?? [], [historyData]);

    useEffect(() => {
        return mountDashboardEventStream();
    }, []);

    return (
        <div className="flex flex-col xl:flex-row h-full">
            {/* Main content - History List */}
            <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 overflow-auto">
                <div className="mb-6">
                    <h1 className="text-lg font-semibold mb-1">Historial de Subidas</h1>
                    <p className="text-sm text-muted-foreground">
                        Registro completo de archivos procesados y su estado.
                    </p>
                </div>
                
                <UploadHistoryTable 
                    uploads={history} 
                    fetchNextPage={() => fetchNextPage({cancelRefetch: false})} 
                />
            </div>

            {/* Right column - Active Uploads */}
            <div
                className="h-1/2 xl:h-auto xl:w-80 2xl:w-96 border-t xl:border-t-0 xl:border-l border-border bg-card/50 overflow-hidden">
                <ProcessingQueue uploads={pendingUploads} emptyMessage="No hay subidas activas en este momento" />
            </div>
        </div>
    )
}
