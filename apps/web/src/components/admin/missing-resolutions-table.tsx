"use client"

import {AlertTriangle} from "lucide-react"
import {formatResolutionId} from "@/lib/utils"
import {MissingResolution} from "@/lib/definitions/resolutions";
import {TableVirtuoso, TableVirtuosoHandle, Virtuoso, VirtuosoHandle} from 'react-virtuoso'
import React, {useImperativeHandle, useRef} from "react";

export type MissingResolutionsTableHandle = {
    scrollToTop: () => void;
}

interface MissingResolutionsTableProps {
    resolutions: MissingResolution[],
    fetchNextPage: () => void,
    ref?: React.Ref<MissingResolutionsTableHandle>
}

export function MissingResolutionsTable({resolutions, fetchNextPage, ref}: MissingResolutionsTableProps) {
    const desktopRef = useRef<TableVirtuosoHandle | null>(null);
    const mobileRef = useRef<VirtuosoHandle>(null);

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

                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-16 bg-muted/30 shadow-[inset_0px_-1.5px_0px_0px_var(--border)]"></th>
                        <th className="pe-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/30 shadow-[inset_0px_-1.5px_0px_0px_var(--border)]">
                            Identificador
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-36 bg-muted/30 shadow-[inset_0px_-1.5px_0px_0px_var(--border)]">
                            Referencias
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
                }} computeItemKey={(_, item) => `${item.initial}-${item.number}-${item.year}` } itemContent={
                    (index, resolution) => {
                        return (<>
                            <td className="px-4 py-3">
                                <AlertTriangle className="h-5 w-5 text-status-warning mx-auto"/>
                            </td>
                            <td className="pe-4 py-3">
                                <span className="font-mono font-bold text-foreground">
                                    {formatResolutionId(resolution)}
                                </span>
                            </td>
                            <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-muted text-muted-foreground">
                                    {resolution.referencesCount} citas
                                </span>
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
                      computeItemKey={(_, item) => `${item.initial}-${item.number}-${item.year}`}
                      overscan={600}
                      components={{
                        List: (props) => (
                            <div {...props} className="divide-y divide-border"/>
                        )
                      }}
                      itemContent={(_, resolution) => {
                          return (
                              <div className="p-3 md:p-4 flex items-center gap-3">
                                  <AlertTriangle className="h-5 w-5 text-status-warning shrink-0"/>
                                  <div className="flex-1 min-w-0">
                                      <span className="font-mono font-bold text-sm text-foreground truncate block">
                                          {formatResolutionId(resolution)}
                                      </span>
                                      <span className="text-xs text-muted-foreground mt-1 block">
                                          Referenciada {resolution.referencesCount} veces
                                      </span>
                                  </div>
                              </div>
                          )
                      }}/>
        </div>
            {resolutions.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">No se encontraron resoluciones faltantes</div>
            )}
        </div>
    )
}
