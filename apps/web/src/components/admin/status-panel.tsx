"use client"
import {FileText, Check, X, ChevronRight, Loader2} from "lucide-react"
import {cn, formatDateTime} from "@/lib/utils"
import {Progress} from "@/components/ui/progress"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {UploadWithFile, UploadWithProgressAndFile} from "@/lib/definitions/uploads";
//TODO don't depend on the repo package
import {UploadStatus} from "@repo/db/prisma/enums";

interface StatusPanelProps {
    unfinished: UploadWithProgressAndFile[]
    recent: UploadWithFile[]
}

export function StatusPanel({unfinished, recent}: StatusPanelProps) {
    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-4rem)] xl:max-h-screen">
            {/* Processing queue - Top section*/}
            <div className="flex-[3] min-h-0 p-4 border-b border-border overflow-auto">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    {unfinished.length > 0 && <Loader2 className={"h-4 w-4 animate-spin text-status-info"}/>}
                    En proceso
                </h3>

                {unfinished.length > 0 ? (
                    <div className="space-y-3">
                        {unfinished.map((job) => (
                            <div key={job.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="h-4 w-4 text-muted-foreground shrink-0"/>
                                    {job.file && <span
                                        className="text-sm font-medium text-foreground truncate">{job.file.originalFileName}</span>}
                                </div>
                                <Progress value={30} className="h-1.5 mb-2"/>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{job.progress}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No hay archivos en proceso</p>
                )}
            </div>

            {/* Recent activity - Bottom section */}
            <div className="flex-[2] min-h-0 p-4 overflow-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground">Actividad reciente</h3>
                    <button className="text-xs text-primary hover:underline flex items-center gap-0.5">
                        Ver historial
                        <ChevronRight className="h-3 w-3"/>
                    </button>
                </div>

                <div className="space-y-2">
                    {recent.map((item) => (
                        <RecentItemRow key={item.id} item={item}/>
                    ))}
                </div>
            </div>
        </div>
    )
}

function RecentItemRow({item}: { item: UploadWithFile }) {
    const isError = item.status === UploadStatus.FAILED

    const content = (
        <div
            className={cn(
                "flex items-center gap-3 p-2.5 rounded-lg transition-colors",
                isError ? "hover:bg-status-error/5 cursor-pointer" : "hover:bg-muted/50",
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

    if (isError && item.errorMsg) {
        return (
            <Dialog>
                <DialogTrigger asChild>{content}</DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-status-error">
                            <X className="h-5 w-5"/>
                            Error de procesamiento
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            {item.file && <span className="font-mono text-sm block mb-2">{item.file.originalFileName}</span>}
                            <span className="text-foreground">{item.errorMsg}</span>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        )
    }

    return content
}
