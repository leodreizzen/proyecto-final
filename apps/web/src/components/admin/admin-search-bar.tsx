"use client"

import {Search} from "lucide-react"
import {Input} from "@/components/ui/input"
import {useDebounceCallback} from "usehooks-ts";

interface AdminSearchBarProps {
    initialQuery: string
    onSearch: (value: string) => void
    placeholder?: string
    className?: string
}

export function AdminSearchBar({initialQuery, onSearch, placeholder = "Buscar...", className}: AdminSearchBarProps) {
    const searchDebounced = useDebounceCallback(onSearch, 300)

    return (
        <div className={className}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"/>
                <Input
                    type="text"
                    placeholder={placeholder}
                    defaultValue={initialQuery}
                    onChange={(e) => searchDebounced(e.target.value)}
                    className="pl-9 bg-card w-full"
                />
            </div>
        </div>
    )
}
