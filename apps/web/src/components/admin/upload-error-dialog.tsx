"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {X, FileText} from "lucide-react"
import React from "react";

interface UploadErrorItem {
    file?: {
        originalFileName: string;
    } | null;
    errorMsg: string | null;
}

interface UploadErrorDialogProps {
    children: React.ReactNode
    item: UploadErrorItem
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function UploadErrorDialog({children, item, open, onOpenChange}: UploadErrorDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-status-error">
                        <X className="h-5 w-5"/>
                        Error de procesamiento
                    </DialogTitle>
                    <DialogDescription>
                        Ocurrió un error al procesar el archivo.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex flex-col gap-4 py-4">
                     <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                        <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center border border-border shrink-0">
                            <FileText className="h-5 w-5 text-muted-foreground"/>
                        </div>
                        <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                                {item.file?.originalFileName}
                            </p>
                            <p className="text-sm text-status-error break-words mt-1">
                                {item.errorMsg || "Error desconocido"}
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
