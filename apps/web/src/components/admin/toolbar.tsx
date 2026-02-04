"use client"

import {Upload} from "lucide-react"
import {Button} from "@/components/ui/button"
import {useRef, useState} from "react";
import UploadModal from "@/components/admin/upload-modal";
import {uploadResolutions} from "@/lib/actions/client/uploads";
import {AdminSearchBar} from "@/components/admin/admin-search-bar";
import {useMutation} from "@tanstack/react-query";
import {useNavigationGuard} from "next-navigation-guard";

interface ToolbarProps {
    initialSearchQuery: string
    onSearch: (value: string) => void
}

export function Toolbar({initialSearchQuery, onSearch}: ToolbarProps) {
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const abortControllers = useRef<AbortController[]>([]);

    const {mutate: mutateUploadResolutions, status: uploadStatus} = useMutation({
        mutationFn: async (files: File[]) => {
            const abortController = new AbortController();
            abortControllers.current.push(abortController);
            await uploadResolutions(files, abortController)
        },
    })

    useNavigationGuard({
        enabled: uploadStatus === "pending",
        confirm: () => {
            const confirm = window.confirm("Hay subidas en curso. Al salir de la página se cancelarán. \n¿Estás seguro de que quieres salir?")
            if (confirm) {
                abortControllers.current.forEach(controller => {
                    controller.abort()
                });
            }
            return confirm;
        }
    })

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
            <UploadModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} onUpload={mutateUploadResolutions}/>
        </div>
    )
}
