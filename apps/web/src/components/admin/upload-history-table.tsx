"use client"

import {FileText, Check, X} from "lucide-react"
import {cn, formatDateTime} from "@/lib/utils"
import {TableVirtuoso, TableVirtuosoHandle, Virtuoso, VirtuosoHandle} from 'react-virtuoso'
import React, {useImperativeHandle, useRef, useState} from "react";
import {UploadHistoryItem} from "@/lib/data/uploads";
import {UploadSuccessDialog} from "@/components/admin/upload-success-dialog";
import {UploadErrorDialog} from "@/components/admin/upload-error-dialog";

export type UploadHistoryTableHandle = {
    scrollToTop: () => void;
}

interface UploadHistoryTableProps {
    uploads: UploadHistoryItem[],
    fetchNextPage: () => void,
    ref?: React.Ref<UploadHistoryTableHandle>
}

export function UploadHistoryTable({uploads, fetchNextPage, ref}: UploadHistoryTableProps) {
    const desktopRef = useRef<TableVirtuosoHandle | null>(null);
    const mobileRef = useRef<VirtuosoHandle>(null);
    const [selectedItem, setSelectedItem] = useState<UploadHistoryItem | null>(null);

    useImperativeHandle(ref, () => ({
        scrollToTop: () => {
            desktopRef.current?.scrollToIndex({index: 0, align: "start"});
            mobileRef.current?.scrollToIndex({index: 0, align: "start"});
        }
    }))

    return (
        <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block size-full">
                <TableVirtuoso ref={desktopRef} className="w-full" overscan={600} fixedHeaderContent={() => (
                    <tr className="bg-card">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/30 shadow-[inset_0px_-1.5px_0px_0px_var(--border)]">
                            Archivo
                        </th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-40 bg-muted/30 shadow-[inset_0px_-1.5px_0px_0px_var(--border)]">
                            Usuario
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-40 bg-muted/30 shadow-[inset_0px_-1.5px_0px_0px_var(--border)]">
                            Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32 bg-muted/30 shadow-[inset_0px_-1.5px_0px_0px_var(--border)]">
                            Estado
                        </th>
                    </tr>
                )} data={uploads} endReached={fetchNextPage} components={{
                    Table: (props) => (
                        <table {...props} className="w-full"/>
                    ),
                    TableRow: (props) => (
                        <tr {...props} 
                            className="hover:bg-muted/20 transition-colors cursor-pointer"
                        />
                    ),
                    TableBody: (props) => (
                        <tbody {...props} className="divide-y divide-border"/>
                    )
                }} computeItemKey={(_, item) => item.id } itemContent={
                    (index, item) => {
                        const isError = item.status === "FAILED";
                        
                        return (
                            <>
                                <td className="px-4 py-3" onClick={() => setSelectedItem(item)}>
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground shrink-0"/>
                                        <span className="font-medium text-sm truncate max-w-[200px] xl:max-w-[300px]" title={item.file?.originalFileName}>
                                            {item.file?.originalFileName}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3" onClick={() => setSelectedItem(item)}>
                                    <span className="text-sm text-muted-foreground truncate block max-w-[150px]" title={item.uploader.name}>
                                        {item.uploader.name}
                                    </span>
                                </td>
                                <td className="px-4 py-3" onClick={() => setSelectedItem(item)}>
                                    <span className="text-sm text-muted-foreground">
                                        {formatDateTime(item.uploadedAt)}
                                    </span>
                                </td>
                                <td className="px-4 py-3" onClick={() => setSelectedItem(item)}>
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                                        isError 
                                            ? "bg-status-error/10 text-status-error border-status-error/20" 
                                            : "bg-status-success/10 text-status-success border-status-success/20"
                                    )}>
                                        {isError ? <X className="h-3.5 w-3.5"/> : <Check className="h-3.5 w-3.5"/>}
                                        {isError ? "Fallido" : "Completado"}
                                    </span>
                                </td>
                            </>
                        );
                    }
                }/>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden size-full">
            <Virtuoso data={uploads}
                      ref={mobileRef}
                      overscan={600}
                      endReached={fetchNextPage}
                      computeItemKey={(_, item) => item.id}
                      components={{
                        List: (props) => (
                            <div {...props} className="divide-y divide-border"/>
                        )
                      }}
                      itemContent={(_, item) => {
                          const isError = item.status === "FAILED";
                          
                          return (
                              <div 
                                className="p-3 md:p-4 flex items-center gap-3 active:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => setSelectedItem(item)}
                              >
                                  <div className={cn(
                                      "flex h-9 w-9 items-center justify-center rounded-full shrink-0",
                                      isError ? "bg-status-error/10" : "bg-status-success/10"
                                  )}>
                                      {isError ? <X className="h-5 w-5 text-status-error"/> : <Check className="h-5 w-5 text-status-success"/>}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm text-foreground truncate">{item.file?.originalFileName}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs text-muted-foreground">{item.uploader.name}</span>
                                          <span className="text-xs text-muted-foreground">•</span>
                                          <span className="text-xs text-muted-foreground">{formatDateTime(item.uploadedAt)}</span>
                                      </div>
                                  </div>
                              </div>
                          );
                      }}/>
        </div>
            {uploads.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">No hay historial de subidas</div>
            )}
            
            {/* Unified Dialog Controller */}
            {selectedItem && (
                selectedItem.status === "FAILED" ? (
                    <UploadErrorDialog 
                        item={selectedItem} 
                        open={!!selectedItem} 
                        onOpenChange={(open) => !open && setSelectedItem(null)}
                    >
                        <div className="hidden" /> 
                    </UploadErrorDialog>
                ) : (
                    <UploadSuccessDialog 
                        item={selectedItem}
                        open={!!selectedItem}
                        onOpenChange={(open) => !open && setSelectedItem(null)}
                    >
                        <div className="hidden" />
                    </UploadSuccessDialog>
                )
            )}
        </div>
    )
}
