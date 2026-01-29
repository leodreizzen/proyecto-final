"use client"

import {FileText, ExternalLink, Trash2, Check, AlertTriangle, AlertCircle, Loader2} from "lucide-react"
import {cn, formatResolutionId} from "@/lib/utils"
import {Button} from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {ResolutionWithStatus} from "@/lib/definitions/resolutions";
import {useMutation} from "@tanstack/react-query";
import {deleteResolution as deleteResolutionAction} from "@/lib/actions/server/resolutions";
import {toast} from "sonner";
import {TableVirtuoso, TableVirtuosoHandle, Virtuoso, VirtuosoHandle} from 'react-virtuoso'
import React, {useImperativeHandle, useRef} from "react";
import Link from "next/link";
import {pathForResolution} from "@/lib/paths";

export type ResolutionsTableHandle = {
    scrollToTop: () => void;
}

interface ResolutionsTableProps {
    resolutions: ResolutionWithStatus[],
    fetchNextPage: () => void,
    ref?: React.Ref<ResolutionsTableHandle>
}

const statusConfig = {
    ok: {
        label: "Correcto",
        icon: Check,
        className: "bg-status-success/10 text-status-success border-status-success/20",
    },
    missingRef: {
        label: "Ref. Faltante",
        icon: AlertTriangle,
        className: "bg-status-warning/10 text-status-warning border-status-warning/20",
    },
    inconsistent: {
        label: "Inconsistente",
        icon: AlertCircle,
        className: "bg-status-error/10 text-status-error border-status-error/20",
    },
}


export function ResolutionsTable({resolutions, fetchNextPage, ref}: ResolutionsTableProps) {
    const {mutate: deleteResolution, status: deleteStatus, variables: deleteVariables} = useMutation({
        mutationFn: async ({id}: { id: string }) => {
            const res = await deleteResolutionAction({id})
            if (!res.success) {
                throw new Error();
            }
        },
        onSuccess: () => {
            toast.success("Resolución eliminada correctamente");
        },
        onError: (_error, {id}) => {
            toast.error("Error al eliminar resolución");
            console.log(`error deleting resolution ${id}`)
        }
    })

    const desktopRef = useRef<TableVirtuosoHandle | null>(null);
    const mobileRef = useRef<VirtuosoHandle>(null);

    const deleting = deleteStatus === "pending";
    const deleteId = deleteVariables?.id;

    useImperativeHandle(ref, () => ({
        scrollToTop: () => {
            desktopRef.current?.scrollToIndex({index: 0, align: "start"});
            mobileRef.current?.scrollToIndex({index: 0, align: "start"});
        }
    }))

    function handleDelete(resolutionId: string) {
        deleteResolution({id: resolutionId});
    }

    return (
        <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block size-full">
                <TableVirtuoso ref={desktopRef} className="w-full" fixedHeaderContent={() => (
                    <tr className="bg-card">

                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-16 bg-muted/30 shadow-[inset_0px_-1.5px_0px_0px_var(--border)]"></th>
                        <th className="pe-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/30 shadow-[inset_0px_-1.5px_0px_0px_var(--border)]">
                            Identificador
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-36 bg-muted/30 shadow-[inset_0px_-1.5px_0px_0px_var(--border)]">
                            Estado
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-28 bg-muted/30 shadow-[inset_0px_-1.5px_0px_0px_var(--border)]">
                            Acciones
                        </th>
                    </tr>
                )} data={resolutions} endReached={fetchNextPage} components={{
                    Table: (props) => (
                        <table {...props} className="w-full"/>
                    ),
                    TableRow: (props) => (
                        <tr {...props} className="hover:bg-muted/20 transition-colors"/>
                    ),
                    TableBody: (props) => (
                        <tbody {...props} className="divide-y divide-border"/>
                    )
                }} computeItemKey={(_, item) => item.id } itemContent={
                    (index, resolution) => {
                        const status = statusConfig[resolution.status]
                        const StatusIcon = status.icon

                        return (<>
                            <td className="px-4 py-3">
                                <FileText className="h-5 w-5 text-muted-foreground mx-auto"/>
                            </td>
                            <td className="pe-4 py-3">
                                <button
                                    className="font-mono font-bold text-foreground hover:text-primary transition-colors">
                                    {formatResolutionId(resolution)}
                                </button>
                            </td>
                            <td className="px-4 py-3">
                    <span
                        className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                            status.className,
                        )}
                    >
                      <StatusIcon className="h-3.5 w-3.5"/>
                        {status.label}
                    </span>
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-1">
                                    <Button
                                        asChild
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        disabled={deleting}
                                    >
                                        <Link prefetch={false} href={pathForResolution({initial: resolution.initial, number: resolution.number, year: resolution.year})}><ExternalLink className="h-4 w-4"/></Link>
                                    </Button>
                                    {(deleting && deleteId === resolution.id) ? (
                                        <div className="flex items-center justify-center h-8 w-8">
                                            <Loader2
                                                className={"h-4 w-4 animate-spin text-status-info"}/>
                                        </div>
                                    ) : (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    disabled={deleting}
                                                >
                                                    <Trash2 className="h-4 w-4"/>
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Eliminar
                                                        resolución?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta acción no se puede deshacer. Se
                                                        eliminará
                                                        permanentemente
                                                        la resolución{" "}
                                                        <span
                                                            className="font-mono font-semibold">{formatResolutionId(resolution)}</span>.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => deleteResolution({id: resolution.id})}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Eliminar
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                            </td>
                        </>)
                    }
                }/>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden size-full">
            <Virtuoso data={resolutions}
                      ref={mobileRef}
                      endReached={fetchNextPage}
                      computeItemKey={(_, item) => item.id}
                      components={{
                        List: (props) => (
                            <div {...props} className="divide-y divide-border"/>
                        )
                      }}
                      itemContent={(_, resolution) => {
                          const status = statusConfig[resolution.status]
                          const StatusIcon = status.icon

                          return (
                              <div key={resolution.id} className="p-3 md:p-4 flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-muted-foreground shrink-0"/>
                                  <div className="flex-1 min-w-0">
                                      <button
                                          className="font-mono font-bold text-sm text-foreground hover:text-primary transition-colors truncate block">
                                          {formatResolutionId(resolution)}
                                      </button>
                                      <span
                                          className={cn(
                                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border mt-1",
                                              status.className,
                                          )}
                                      >
                  <StatusIcon className="h-3 w-3"/>
                                          {status.label}
                </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"
                                              disabled={deleting}>
                                          <ExternalLink className="h-4 w-4"/>
                                      </Button>
                                      {(deleting && deleteId === resolution.id) ?
                                          <div className="flex items-center justify-center h-8 w-8">
                                              <Loader2 className={"h-4 w-4 animate-spin text-status-info"}/>
                                          </div>
                                          : <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                  <Button variant="ghost" size="icon"
                                                          className="h-8 w-8 text-muted-foreground" disabled={deleting}>
                                                      <Trash2 className="h-4 w-4"/>
                                                  </Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent>
                                                  <AlertDialogHeader>
                                                      <AlertDialogTitle>¿Eliminar resolución?</AlertDialogTitle>
                                                      <AlertDialogDescription>
                                                          Esta acción no se puede deshacer. Se eliminará permanentemente
                                                          la
                                                          resolución{" "}
                                                          <span
                                                              className="font-mono font-semibold">{formatResolutionId(resolution)}</span>.
                                                      </AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter>
                                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                      <AlertDialogAction
                                                          onClick={() => handleDelete(resolution.id)}
                                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                      >
                                                          Eliminar
                                                      </AlertDialogAction>
                                                  </AlertDialogFooter>
                                              </AlertDialogContent>
                                          </AlertDialog>}
                                  </div>
                              </div>
                          )
                      }}/>
        </div>
            {resolutions.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">No se encontraron resoluciones</div>
            )}
        </div>
    )
}
