"use client";

import {AlertCircle, CheckCircle2, Clock, HelpCircle, Loader2, Loader2Icon, RefreshCw, XCircle} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {Button} from "@/components/ui/button";
import {formatMaintenanceTaskStatus, formatMaintenanceTaskType, formatResolutionId} from "@/lib/utils";
import {MaintenanceTaskStatus} from "@repo/db/prisma/enums";
import {TableVirtuoso, TableVirtuosoHandle, Virtuoso, VirtuosoHandle} from "react-virtuoso";
import React, {useImperativeHandle, useRef} from "react";
import {MaintenanceTaskWithResolution} from "@/lib/data/maintenance";
import {cn} from "@/lib/utils";
import {useMutation} from "@tanstack/react-query";
import {toast} from "sonner";
import {retryMaintenanceTaskAction} from "@/lib/actions/server/maintenance-tasks";

export type MaintenanceTasksTableHandle = {
    scrollToTop: () => void;
};

const TASK_DESCRIPTIONS: Partial<Record<string, string>> = {
    EVALUATE_IMPACT: "Evaluar el impacto de un agregado de resolución. Se desencadena cuando se agrega o elimina una resolución, o se procesan cambios avanzados",
    PROCESS_ADVANCED_CHANGES: "Procesar cambios avanzados que afectan a esta resolución",
    CALCULATE_EMBEDDINGS: "Calcular embeddings para el chatbot. Se desencadena cuando se modifica una resolución",
};

interface MaintenanceTasksTableProps {
    tasks: MaintenanceTaskWithResolution[];
    fetchNextPage: () => void;
    ref?: React.Ref<MaintenanceTasksTableHandle>;
}

const StatusIcon = ({status}: { status: MaintenanceTaskStatus }) => {
    switch (status) {
        case "PENDING":
            return <Clock className="h-5 w-5 text-muted-foreground"/>;
        case "PROCESSING":
            return <Loader2 className="h-5 w-5 text-blue-500 animate-spin"/>;
        case "COMPLETED":
            return <CheckCircle2 className="h-5 w-5 text-green-500"/>;
        case "PARTIAL_FAILURE":
            return <AlertCircle className="h-5 w-5 text-orange-500"/>;
        case "FAILED":
            return <XCircle className="h-5 w-5 text-destructive"/>;
    }
};

export function MaintenanceTasksTable({tasks, fetchNextPage, ref}: MaintenanceTasksTableProps) {
    const desktopRef = useRef<TableVirtuosoHandle | null>(null);
    const mobileRef = useRef<VirtuosoHandle>(null);

    const {mutate: retryTask, status: retryStatus, variables: retryVariables} = useMutation({
        mutationFn: async ({id}: { id: string }) => {
            const res = await retryMaintenanceTaskAction({id})
            if (!res.success) {
                throw new Error();
            }
        },
        onSuccess: () => {
            toast.success("Reintento desencadenado con éxito");
        },
        onError: (_error, {id}) => {
            toast.error("Error al reintentar la tarea");
            console.log(`error retrying task ${id}: ${_error}`);
        }
    })

    const processing = retryStatus === "pending";


    useImperativeHandle(ref, () => ({
        scrollToTop: () => {
            desktopRef.current?.scrollToIndex({index: 0, align: "start"});
            mobileRef.current?.scrollToIndex({index: 0, align: "start"});
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
                        Table: (props) => <table {...props} className="w-full"/>,
                        TableRow: (props) => <tr {...props} className="hover:bg-muted/20 transition-colors"/>,
                        TableBody: (props) => <tbody {...props} className="divide-y divide-border"/>,
                    }}
                    computeItemKey={(_, item) => item.id}
                    itemContent={(index, task) => {
                        return (
                            <>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-center">
                                        <StatusIcon status={task.status}/>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                                            {formatMaintenanceTaskType(task.type)}
                                            {TASK_DESCRIPTIONS[task.type] && (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <HelpCircle
                                                            className="w-3.5 h-3.5 text-muted-foreground/70 cursor-pointer hover:text-foreground transition-colors"/>
                                                    </PopoverTrigger>
                                                    <PopoverContent
                                                        className="max-w-[300px] text-sm p-3 bg-secondary/80 backdrop-blur-sm shadow-md">
                                                        <p>{TASK_DESCRIPTIONS[task.type]}</p>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        </span>
                                        {task.status === "FAILED" && task.errorMsg && (
                                            <span className="text-xs text-destructive mt-0.5 truncate max-w-[200px]"
                                                  title={task.errorMsg}>
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
                                            task.status === "PARTIAL_FAILURE" ? "bg-orange-500/10 text-orange-600 border-orange-500/20" :
                                                task.status === "COMPLETED" ? "bg-green-500/10 text-green-600 border-green-500/20" :
                                                    task.status === "PROCESSING" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                                        "bg-muted text-muted-foreground border-transparent"
                                    )}>
                                        {formatMaintenanceTaskStatus(task.status)}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {(task.status === "FAILED" || task.status === "PARTIAL_FAILURE") && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                    onClick={() => retryTask({id: task.id})}
                                                    disabled={processing}
                                                >
                                                    {(processing && retryVariables.id === task.id) ? (
                                                        <Loader2Icon className="h-4 w-4 animate-spin"/>
                                                    ) : (
                                                        <RefreshCw className="h-4 w-4"/>
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Reintentar tarea</p>
                                            </TooltipContent>
                                        </Tooltip>
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
                        List: (props) => <div {...props} className="divide-y divide-border"/>,
                    }}
                    itemContent={(_, task) => {
                        return (
                            <div className="p-3 flex items-start gap-3">
                                <div className="mt-1">
                                    <StatusIcon status={task.status}/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <span className="font-medium text-sm text-foreground flex items-center gap-1.5">
                                            {formatMaintenanceTaskType(task.type)}
                                            {TASK_DESCRIPTIONS[task.type] && (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <HelpCircle
                                                            className="w-3.5 h-3.5 text-muted-foreground/70 cursor-pointer hover:text-foreground transition-colors"/>
                                                    </PopoverTrigger>
                                                    <PopoverContent
                                                        className="max-w-[300px] text-sm p-3 bg-secondary/80 backdrop-blur-sm shadow-md">
                                                        <p>{TASK_DESCRIPTIONS[task.type]}</p>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
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