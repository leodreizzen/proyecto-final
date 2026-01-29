"use client"

import {Upload} from "lucide-react"
import {Button} from "@/components/ui/button"
import {useState} from "react";
import UploadModal from "@/components/admin/upload-modal";
import {uploadResolutions} from "@/lib/actions/client/uploads";
import {AdminSearchBar} from "@/components/admin/admin-search-bar";

interface ToolbarProps {
    initialSearchQuery: string
    onSearch: (value: string) => void
}

export function Toolbar({initialSearchQuery, onSearch}: ToolbarProps) {
    const [uploadModalOpen, setUploadModalOpen] = useState(false);

    return (
        <div className="flex flex-col-reverse sm:flex-row gap-3 mb-4">
            {/* Search */}
            <AdminSearchBar 
                initialQuery={initialSearchQuery} 
                onSearch={onSearch} 
                placeholder="Buscar por ID, año... (ej. 60-2025 o CSU-60)"
                className="flex-1"
            />

            {/* Upload button */}
            <Button className="gap-2 shrink-0" onClick={() => setUploadModalOpen(true)}>
                <Upload className="h-4 w-4"/>
                <span>Subir PDF</span>
            </Button>
            <UploadModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} onUpload={uploadResolutions}/>
        </div>
    )
}
