"use client"
import {Toolbar} from "./toolbar"
import {MissingResolutionsTable, MissingResolutionsTableHandle} from "./missing-resolutions-table"
import {MissingResolution} from "@/lib/definitions/resolutions";
import {useEffect, useMemo, useRef, useState} from "react";
import {keepPreviousData, useInfiniteQuery} from "@tanstack/react-query";
import {missingResolutionsQuery} from "@/lib/queries/admin/queries";
import {mountDashboardEventStream} from "@/lib/queries/admin/event-handler";

export function RevisionView({
                                initialResolutions,
                                initialSearch = ""
                            }: {
    initialResolutions: MissingResolution[],
    initialSearch?: string
}) {
    const [search, setSearch] = useState(initialSearch);
    const tableRef = useRef<MissingResolutionsTableHandle>(null);

    useEffect(() => {
        return mountDashboardEventStream();
    }, []);

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

    const {data: resolutionsData, fetchNextPage, isPlaceholderData} = useInfiniteQuery({
        ...missingResolutionsQuery(search),
        initialData: () => (search === initialSearch) ? {pages: [initialResolutions], pageParams: [null]} : undefined,
        placeholderData: keepPreviousData,
        initialDataUpdatedAt: search !== initialSearch ? 0 : undefined
    });

    const resolutions = useMemo(() => resolutionsData?.pages?.flat() ?? [], [resolutionsData]);

    const lastScrolledSearch = useRef(initialSearch);

    // scroll to top on new search, but only after data arrives
    useEffect(() => {
        if (!isPlaceholderData && lastScrolledSearch.current !== search){
            tableRef.current?.scrollToTop();
            lastScrolledSearch.current = search;
        }
    }, [isPlaceholderData, search]);

    return (
        <div className="flex flex-col xl:flex-row h-full">
            {/* Main content - Missing Resolutions List */}
            <div className="flex-1 xl:w-1/2 flex flex-col min-w-0 p-4 lg:p-6 overflow-auto">
                <div className="mb-6">
                    <h1 className="text-lg font-semibold mb-1">Resoluciones Faltantes</h1>
                    <p className="text-sm text-muted-foreground">
                        Estas resoluciones son referenciadas por otros documentos pero no están cargadas en el sistema.
                    </p>
                </div>
                
                <Toolbar initialSearchQuery={initialSearch} onSearch={handleSearch}/>
                <MissingResolutionsTable 
                    resolutions={resolutions} 
                    fetchNextPage={() => fetchNextPage({cancelRefetch: false})} 
                    ref={tableRef}
                />
            </div>

            {/* Right column - Tasks List Placeholder */}
            <div
                className="flex-1 xl:w-1/2 border-t xl:border-t-0 xl:border-l border-border bg-card/50 p-6 flex flex-col">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-1">Tareas Pendientes</h2>
                    <p className="text-sm text-muted-foreground">
                        Listado global de tareas de revisión y mantenimiento.
                    </p>
                </div>
                
                <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                    <div className="max-w-[240px]">
                        <p className="text-sm">Próximamente verás aquí las tareas pendientes de revisión.</p>
                        <p className="text-xs mt-2 opacity-50">(Funcionalidad en desarrollo)</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
