"use client"

import {Search, Upload} from "lucide-react"
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import {useState} from "react";
import UploadModal from "@/components/admin/upload-modal";
import {uploadResolutions} from "@/lib/actions/client/uploads";
import {useDebounceCallback} from "usehooks-ts";

interface ToolbarProps {
    initialSearchQuery: string
    onSearch: (value: string) => void
}

export function Toolbar({initialSearchQuery, onSearch}: ToolbarProps) {
    const searchDebounced = useDebounceCallback(onSearch, 300)
    const [uploadModalOpen, setUploadModalOpen] = useState(false);

    return (
        <div className="flex flex-col-reverse sm:flex-row gap-3 mb-4">
            {/* Search */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input
                    type="text"
                    placeholder="Buscar por ID, año... (ej. 60-2025 o CSU-60)"
                    defaultValue={initialSearchQuery}
                    onChange={(e) => searchDebounced(e.target.value)}
                    className="pl-9 bg-card"
                />
            </div>

            {/* Upload button */}
            <Button className="gap-2 shrink-0" onClick={() => setUploadModalOpen(true)}>
                <Upload className="h-4 w-4"/>
                <span>Subir PDF</span>
            </Button>
            <UploadModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} onUpload={uploadResolutions}/>
        </div>
    )
}
