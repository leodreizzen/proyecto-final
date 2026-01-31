"use client";

import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { formatMaintenanceTaskStatus, formatMaintenanceTaskType, formatResolutionId } from "@/lib/utils";
import { MaintenanceTaskStatus } from "@repo/db/prisma/enums";
import { TableVirtuoso, TableVirtuosoHandle, Virtuoso, VirtuosoHandle } from "react-virtuoso";
import React, { useImperativeHandle, useRef } from "react";
import { MaintenanceTaskWithResolution } from "@/lib/data/maintenance";
import { cn } from "@/lib/utils";

export type MaintenanceTasksTableHandle = {
    scrollToTop: () => void;
};

interface MaintenanceTasksTableProps {
    tasks: MaintenanceTaskWithResolution[];
    fetchNextPage: () => void;
    ref?: React.Ref<MaintenanceTasksTableHandle>;
}

const StatusIcon = ({ status }: { status: MaintenanceTaskStatus }) => {
    switch (status) {
        case "PENDING":
            return <Clock className="h-5 w-5 text-muted-foreground" />;
        case "PROCESSING":
            return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
        case "COMPLETED":
            return <CheckCircle2 className="h-5 w-5 text-green-500" />;
        case "FAILED":
            return <XCircle className="h-5 w-5 text-destructive" />;
    }
};

export function MaintenanceTasksTable({ tasks, fetchNextPage, ref }: MaintenanceTasksTableProps) {
    const desktopRef = useRef<TableVirtuosoHandle | null>(null);
    const mobileRef = useRef<VirtuosoHandle>(null);

    useImperativeHandle(ref, () => ({
        scrollToTop: () => {
            desktopRef.current?.scrollToIndex({ index: 0, align: "start" });
            mobileRef.current?.scrollToIndex({ index: 0, align: "start" });
        },
    }));

    return (
        <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden h-full">
            {/* Desktop table */}
            <div className="hidden md:block size-full">
                <TableVirtuoso
                    ref={desktopRef}
                    className="w-full"
                    overscan={200}
                    fixedHeaderContent={() => (
                        <tr className="bg-card">
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-12 bg-muted/30 shadow-[inset_0px_-1.5px_0px_0px_var(--border)]"></th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/3 bg-muted/30 shadow-[inset_0px_-1.5px_0px_0px_var(--border)]">
                                Tarea
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/30 shadow-[inset_0px_-1.5px_0px_0px_var(--border)]">
                                Resolución
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-24 bg-muted/30 shadow-[inset_0px_-1.5px_0px_0px_var(--border)]">
                                Estado
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-28 bg-muted/30 shadow-[inset_0px_-1.5px_0px_0px_var(--border)]">
                                Acciones
                            </th>
                        </tr>
                    )}
                    data={tasks}
                    endReached={fetchNextPage}
                    components={{
                        Table: (props) => <table {...props} className="w-full" />,
                        TableRow: (props) => <tr {...props} className="hover:bg-muted/20 transition-colors" />,
                        TableBody: (props) => <tbody {...props} className="divide-y divide-border" />,
                    }}
                    computeItemKey={(_, item) => item.id}
                    itemContent={(index, task) => {
                        return (
                            <>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-center">
                                        <StatusIcon status={task.status} />
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-foreground">
                                            {formatMaintenanceTaskType(task.type)}
                                        </span>
                                        {task.status === "FAILED" && task.errorMsg && (
                                            <span className="text-xs text-destructive mt-0.5 truncate max-w-[200px]" title={task.errorMsg}>
                                                {task.errorMsg}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="font-mono text-sm text-foreground">
                                        {formatResolutionId(task.resolution)}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={cn(
                                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
                                        task.status === "FAILED" ? "bg-destructive/10 text-destructive border-destructive/20" :
                                        task.status === "COMPLETED" ? "bg-green-500/10 text-green-600 border-green-500/20" :
                                        task.status === "PROCESSING" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                        "bg-muted text-muted-foreground border-transparent"
                                    )}>
                                        {formatMaintenanceTaskStatus(task.status)}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {task.status === "FAILED" && (
                                        <button 
                                            onClick={() => console.log("Retry task", task.id)}
                                            className="text-xs font-medium text-primary hover:underline"
                                        >
                                            Reintentar
                                        </button>
                                    )}
                                </td>
                            </>
                        );
                    }}
                />
            </div>

            {/* Mobile cards */}
            <div className="md:hidden size-full">
                <Virtuoso
                    data={tasks}
                    ref={mobileRef}
                    endReached={fetchNextPage}
                    computeItemKey={(_, item) => item.id}
                    overscan={200}
                    components={{
                        List: (props) => <div {...props} className="divide-y divide-border" />,
                    }}
                    itemContent={(_, task) => {
                        return (
                            <div className="p-3 flex items-start gap-3">
                                <div className="mt-1">
                                    <StatusIcon status={task.status} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <span className="font-medium text-sm text-foreground block">
                                            {formatMaintenanceTaskType(task.type)}
                                        </span>
                                        <span className="font-mono text-xs text-muted-foreground ml-2">
                                            {formatResolutionId(task.resolution)}
                                        </span>
                                    </div>
                                    
                                    {task.status === "FAILED" && task.errorMsg && (
                                        <p className="text-xs text-destructive mt-1 break-words">
                                            {task.errorMsg}
                                        </p>
                                    )}
                                    
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {task.createdAt.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        );
                    }}
                />
            </div>
            
            {tasks.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">No se encontraron tareas</div>
            )}
        </div>
    );
}