"use client"

import {FileText, Check, X, Loader2} from "lucide-react"
import {Progress} from "@/components/ui/progress"
import {UploadWithProgressAndFile} from "@/lib/definitions/uploads";

export function ProcessingQueue({
                                    uploads,
                                    emptyMessage = "No hay archivos en proceso"
                                }: {
    uploads: UploadWithProgressAndFile[],
    emptyMessage?: string
}) {
    return (
        <div className="flex flex-col h-full min-h-0">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 px-4 pt-4 shrink-0">
                {uploads.length > 0 && <Loader2 className={"h-4 w-4 animate-spin text-status-info"}/>}
                En proceso
            </h3>

            <div className="flex-1 overflow-auto px-4 pb-4">
                {uploads.length > 0 ? (
                    <div className="space-y-3">
                        {uploads.map((job) => (
                            <div key={job.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="h-4 w-4 text-muted-foreground shrink-0"/>
                                    {job.file && <span
                                        className="text-sm font-medium text-foreground truncate">{job.file.originalFileName}</span>}
                                </div>
                                {
                                    job.status === "PROCESSING" ? (
                                        <>
                                            <Progress value={job.progress * 100} className="h-1.5 mb-2"/>
                                            <div
                                                className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>{(job.progress * 100).toFixed(0)}%</span>
                                            </div>
                                        </>
                                    ) : job.status === "PENDING" ? (
                                        <span className="text-xs text-muted-foreground mb-2 block">En cola...</span>
                                    ) : null
                                }
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
