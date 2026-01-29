"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {Check, FileText, ExternalLink} from "lucide-react"
import Link from "next/link"
import {formatResolutionId} from "@/lib/utils"
import {pathForResolution} from "@/lib/paths";
import React from "react";

interface UploadSuccessItem {
    resolution?: {
        initial: string;
        number: number;
        year: number;
    } | null;
    file?: {
        originalFileName: string;
    } | null;
}

interface UploadSuccessDialogProps {
    children: React.ReactNode
    item: UploadSuccessItem
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function UploadSuccessDialog({children, item, open, onOpenChange}: UploadSuccessDialogProps) {
    if (!item.resolution) return <>{children}</>;

    const resolutionPath = pathForResolution(item.resolution);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-status-success">
                        <Check className="h-5 w-5"/>
                        Procesamiento exitoso
                    </DialogTitle>
                    <DialogDescription>
                        El archivo ha sido procesado correctamente y la resolución ha sido creada.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex flex-col gap-4 py-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                        <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center border border-border shrink-0">
                            <FileText className="h-5 w-5 text-muted-foreground"/>
                        </div>
                        <div className="min-w-0">
                            <p className="font-mono font-bold text-foreground truncate">
                                {formatResolutionId(item.resolution)}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                                {item.file?.originalFileName}
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-end">
                    <Button asChild>
                        <Link href={resolutionPath} target="_blank" rel="noopener noreferrer">
                            Ver Resolución
                            <ExternalLink className="ml-2 h-4 w-4"/>
                        </Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
