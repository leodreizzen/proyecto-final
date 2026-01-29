"use client"
import {Check, X, ChevronRight} from "lucide-react"
import {cn, formatDateTime} from "@/lib/utils"
import {UploadWithFile, UploadWithProgressAndFile} from "@/lib/definitions/uploads";
import {UploadStatus} from "@repo/db/prisma/enums";
import {ProcessingQueue} from "@/components/admin/processing-queue";
import Link from "next/link";
import {UploadSuccessDialog} from "@/components/admin/upload-success-dialog";
import {UploadErrorDialog} from "@/components/admin/upload-error-dialog";

interface StatusPanelProps {
    unfinished: UploadWithProgressAndFile[]
    recent: UploadWithFile[]
}

export function StatusPanel({unfinished, recent}: StatusPanelProps) {
    return (
        <div className="flex flex-col h-full xl:max-h-screen overflow-hidden">
            {/* Processing queue - Top section*/}
            <div className="flex-2 xl:flex-3 min-h-0 border-b border-border overflow-hidden">
                <ProcessingQueue uploads={unfinished} />
            </div>

            {/* Recent activity - Bottom section */}
            <div className="flex-2 flex flex-col min-h-0 p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground">Actividad reciente</h3>
                    <Link href="/admin/history" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                        Ver historial
                        <ChevronRight className="h-3 w-3"/>
                    </Link>
                </div>

                <div className="min-h-0 flex-1 space-y-2 overflow-auto">
                    {recent.map((item) => (
                        <RecentItemRow key={item.id} item={item}/>
                    ))}
                </div>
            </div>
        </div>
    )
}

function RecentItemRow({item}: { item: UploadWithFile & { resolution?: { initial: string; number: number; year: number } | null } }) {
    const isError = item.status === UploadStatus.FAILED

    const content = (
        <div
            className={cn(
                "flex items-center gap-3 p-2.5 rounded-lg transition-colors",
                isError ? "hover:bg-status-error/5 cursor-pointer" : "hover:bg-muted/50 cursor-pointer",
            )}
        >
            <div
                className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full shrink-0",
                    isError ? "bg-status-error/10" : "bg-status-success/10",
                )}
            >
                {isError ? <X className="h-4 w-4 text-status-error"/> :
                    <Check className="h-4 w-4 text-status-success"/>}
            </div>
            <div className="flex-1 min-w-0">
                {item.file &&
                    <p className="text-sm font-medium text-foreground truncate">{item.file.originalFileName}</p>}
                <p className="text-xs text-muted-foreground">{formatDateTime(item.uploadedAt)}</p>
            </div>
        </div>
    )

    if (isError) {
        return (
            <UploadErrorDialog item={item}>
                {content}
            </UploadErrorDialog>
        )
    }

    return (
        <UploadSuccessDialog item={item}>
            {content}
        </UploadSuccessDialog>
    )
}
