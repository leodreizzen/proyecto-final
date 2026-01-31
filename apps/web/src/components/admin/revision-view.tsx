"use client"
import {MissingResolutionsTable, MissingResolutionsTableHandle} from "./missing-resolutions-table"
import {MissingResolution} from "@/lib/definitions/resolutions";
import {useEffect, useMemo, useRef, useState} from "react";
import {keepPreviousData, useInfiniteQuery} from "@tanstack/react-query";
import {maintenanceTasksQuery, missingResolutionsQuery} from "@/lib/queries/admin/queries";
import {mountDashboardEventStream} from "@/lib/queries/admin/event-handler";
import {AdminSearchBar} from "@/components/admin/admin-search-bar";
import {MaintenanceTaskFilter, MaintenanceTaskWithResolution} from "@/lib/data/maintenance";
import {MaintenanceTasksTable, MaintenanceTasksTableHandle} from "@/components/admin/maintenance-tasks-table";
import { cn } from "@/lib/utils";

export function RevisionView({
                                initialMissingResolutions,
                                initialMaintenanceTasks,
                                initialMissingSearch = ""
                            }: {
    initialMissingResolutions: MissingResolution[],
    initialMaintenanceTasks: MaintenanceTaskWithResolution[]
    initialMissingSearch?: string
}) {
    const [search, setSearch] = useState(initialMissingSearch);
    const tableRef = useRef<MissingResolutionsTableHandle>(null);
    
    // Maintenance Tasks State
    const [taskFilter, setTaskFilter] = useState<MaintenanceTaskFilter>("ALL");
    const [taskSearch, setTaskSearch] = useState("");
    const tasksTableRef = useRef<MaintenanceTasksTableHandle>(null);

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

    // Missing Resolutions Query
    const {data: resolutionsData, fetchNextPage, isPlaceholderData} = useInfiniteQuery({
        ...missingResolutionsQuery(search),
        initialData: () => (search === initialMissingSearch) ? {pages: [initialMissingResolutions], pageParams: [null]} : undefined,
        placeholderData: keepPreviousData,
    });

    const resolutions = useMemo(() => resolutionsData?.pages?.flat() ?? [], [resolutionsData]);

    const lastScrolledSearch = useRef(initialMissingSearch);

    // scroll to top on new search, but only after data arrives
    useEffect(() => {
        if (!isPlaceholderData && lastScrolledSearch.current !== search){
            tableRef.current?.scrollToTop();
            lastScrolledSearch.current = search;
        }
    }, [isPlaceholderData, search]);

    // Maintenance Tasks Query
    const {
        data: tasksData, 
        fetchNextPage: fetchNextTasksPage
    } = useInfiniteQuery({
        ...maintenanceTasksQuery(taskFilter, taskSearch),
        placeholderData: keepPreviousData,
        initialData: () => (taskFilter === "ALL" && taskSearch === "") ? {pages: [initialMaintenanceTasks], pageParams: [null]} : undefined,
    });
    
    const tasks = useMemo(() => tasksData?.pages?.flat() ?? [], [tasksData]);

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
                
                <AdminSearchBar 
                    initialQuery={initialMissingSearch}
                    onSearch={handleSearch} 
                    placeholder="Buscar por ID, año... (ej. 60-2025 o CSU-60)"
                    className="mb-4"
                />
                <MissingResolutionsTable 
                    resolutions={resolutions} 
                    fetchNextPage={() => fetchNextPage({cancelRefetch: false})} 
                    ref={tableRef}
                />
            </div>

            {/* Right column - Tasks List */}
            <div className="flex-1 xl:w-1/2 border-t xl:border-t-0 xl:border-l border-border bg-card/50 p-4 lg:p-6 flex flex-col min-h-[400px]">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold mb-1">Tareas de Mantenimiento</h2>
                        <p className="text-sm text-muted-foreground">
                            Cola de procesamiento de cambios y actualizaciones.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg w-fit h-fit">
                        {(["ALL", "ACTIVE", "COMPLETED", "FAILED"] as const).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setTaskFilter(filter)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap",
                                    taskFilter === filter
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                )}
                            >
                                {filter === "ALL" ? "Todas" :
                                 filter === "ACTIVE" ? "En Curso" : 
                                 filter === "COMPLETED" ? "Listas" : "Fallidas"}
                            </button>
                        ))}
                    </div>
                    
                    <AdminSearchBar 
                        initialQuery=""
                        onSearch={setTaskSearch}
                        placeholder="Buscar resolución..."
                        className="flex-1 min-w-[200px]"
                    />
                </div>

                <MaintenanceTasksTable
                    tasks={tasks}
                    fetchNextPage={() => fetchNextTasksPage({cancelRefetch: false})}
                    ref={tasksTableRef}
                />
            </div>
        </div>
    )
}
