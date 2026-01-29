"use client"

import {useEffect, useMemo, useRef, useState} from "react";
import {keepPreviousData, useInfiniteQuery} from "@tanstack/react-query";
import {UserListItem} from "@/lib/data/users";
import {usersQuery} from "@/lib/queries/admin/queries";
import {UsersTable, UsersTableHandle} from "@/components/admin/users-table";
import {CreateUserDialog} from "@/components/admin/create-user-dialog";
import {AdminSearchBar} from "@/components/admin/admin-search-bar";
import {mountDashboardEventStream} from "@/lib/queries/admin/event-handler";

export function UsersView({
                              initialUsers,
                              initialSearch = ""
                          }: {
    initialUsers: UserListItem[],
    initialSearch?: string
}) {
    const [search, setSearch] = useState(initialSearch);
    const tableRef = useRef<UsersTableHandle>(null);

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

    const {data: usersData, fetchNextPage, isPlaceholderData} = useInfiniteQuery({
        ...usersQuery(search),
        initialData: () => (search === initialSearch) ? {pages: [initialUsers], pageParams: [null]} : undefined,
        placeholderData: keepPreviousData,
        initialDataUpdatedAt: search !== initialSearch ? 0 : undefined
    });

    const users = useMemo(() => usersData?.pages?.flat() ?? [], [usersData]);

    const lastScrolledSearch = useRef(initialSearch);

    // scroll to top on new search, but only after data arrives
    useEffect(() => {
        if (!isPlaceholderData && lastScrolledSearch.current !== search) {
            tableRef.current?.scrollToTop();
            lastScrolledSearch.current = search;
        }
    }, [isPlaceholderData, search]);

    useEffect(() => {
        mountDashboardEventStream()
    }, []);

    return (
        <div className="flex flex-col h-full min-w-0 p-4 lg:p-6 overflow-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-lg font-semibold mb-1">Gestión de Usuarios</h1>
                    <p className="text-sm text-muted-foreground">
                        Administra las cuentas de usuario y roles del sistema.
                    </p>
                </div>
                <CreateUserDialog/>
            </div>

            <AdminSearchBar 
                initialQuery={initialSearch} 
                onSearch={handleSearch} 
                placeholder="Buscar usuario..."
                className="mb-4"
            />

            <UsersTable
                users={users}
                fetchNextPage={() => fetchNextPage({cancelRefetch: false})}
                ref={tableRef}
            />
        </div>
    )
}
