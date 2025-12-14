"use client"

import {Search, Upload} from "lucide-react"
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import {useState} from "react";
import UploadModal from "@/components/admin/upload-modal";

interface ToolbarProps {
    searchQuery?: string // TODO MAKE THIS REQUIRED
    onSearchChange?: (value: string) => void // TODO MAKE THIS REQUIRED
}

export function Toolbar({searchQuery, onSearchChange}: ToolbarProps) {
    const [uploadModalOpen, setUploadModalOpen] = useState(false);

    return (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* Search */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input
                    type="text"
                    placeholder="Buscar por ID, año..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="pl-9 bg-card"
                />
            </div>

            {/* Upload button */}
            <Button className="gap-2 shrink-0" onClick={() => setUploadModalOpen(true)}>
                <Upload className="h-4 w-4"/>
                <span>Subir PDF</span>
            </Button>
            <UploadModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} onUpload={(files)=> alert(`WIP (${files.length} files)`)}/>
        </div>
    )
}
