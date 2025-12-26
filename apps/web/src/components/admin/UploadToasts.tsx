import {Progress} from "@/components/ui/progress";
import {toast} from "sonner";
import {FileX2} from "lucide-react";

function UploadToasts({currentFile}: {
    currentFile: { index: number, name: string, progress: number }
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <p>Subiendo {currentFile.name}...</p>
            <Progress className="h-1.5" value={currentFile.progress} max={100}/>
        </div>
    );
}

function UploadResultDescription({results}: {
    results: { status: "success" | "error", fileName: string }[]
}) {
    const successCount = results.filter(r => r.status === "success").length;
    const errors = results.filter(r => r.status === "error");

    return (
        <div className="mt-1 space-y-3 text-sm opacity-90">
            {/* Sección de Éxito */}
            {successCount > 0 && (
                <div className="flex items-center gap-2">
                    <span>
                        {successCount} {successCount > 1 ? "archivos subidos" : "archivo subido"} correctamente
                    </span>
                </div>
            )}

            {/* Sección de Errores */}
            {errors.length > 0 && (
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <span>
                            Error en {errors.length} {errors.length > 1 ? "archivos" : "archivo"}:
                        </span>
                    </div>
                    <ul className="grid gap-1">
                        {errors.map((errorFile, index) => (
                            <li key={index} className="flex items-center gap-1.5 text-muted-foreground italic">
                                <FileX2 className="h-3 w-3"/>
                                <span className="truncate max-w-[200px]">{errorFile.fileName}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export function showUploadToast({id, totalFiles, errorCount, currentFile}: {
    id: string, totalFiles: number, errorCount: number, currentFile: {
        index: number,
        name: string,
        progress: number
    }
}) {

    const title = `Subida en proceso (archivo ${currentFile.index + 1} de ${totalFiles}${errorCount > 0 ? ` - ${errorCount} ${errorCount > 1 ? "errores" : "error"}` : ""})`;
    toast.loading(title, {
        id: id,
        duration: Infinity,
        description: <UploadToasts currentFile={currentFile}/>
    });
}

export function showUploadFinishedToast({id, results}: {
    id: string,
    results: {
        status: "success" | "error", fileName: string,
    }[]
}) {
    const description = <UploadResultDescription results={results}/>;
    const successCount = results.filter(r => r.status === "success").length;
    const errorCount = results.filter(r => r.status === "error").length;

    const title = `Subida finalizada` + (errorCount > 0 ? ` con errores` : "");

    if (errorCount === 0) {
        toast.success(title, {
            id: id,
            description: description,
            duration: 5000
        });
    } else if (successCount > 0) {
        toast.warning(title, {
            id: id,
            description: description,
            duration: Infinity,
            closeButton: true,
            icon: null
        })
    } else {
        toast.error(title, {
            id: id,
            description: description,
            duration: Infinity,
            closeButton: true
        });
    }


}