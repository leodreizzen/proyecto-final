import {Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {
    Dropzone,
    DropZoneArea,
    DropzoneDescription,
    DropzoneFileList,
    DropzoneFileListItem,
    DropzoneMessage,
    DropzoneRemoveFile,
    DropzoneTrigger,
    useDropzone,
} from "@/components/ui/dropzone";
import {Button} from "@/components/ui/button";
import {CloudUploadIcon, Trash2Icon} from "lucide-react";
import {filesize} from "filesize";
import {MAX_FILE_SIZE, MAX_FILES_PER_UPLOAD} from "../../../config/files";

export default function UploadModal({open, onOpenChange, onUpload}: {
    open: boolean;
    onOpenChange: (open: boolean) => void,
    onUpload: (files: File[]) => void
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {open && <UploadModalContent onUpload={onUpload} onOpenChange={onOpenChange}/>}
        </Dialog>
    )
}

export function UploadModalContent({onOpenChange, onUpload}: {
    onOpenChange: (open: boolean) => void,
    onUpload: (files: File[]) => void
}) {
    const dropzone = useDropzone({
        onDropFile: async (file: File) => {
            return {
                status: "success",
                result: URL.createObjectURL(file),
            };
        },
        validation: {
            accept: {
                "application/pdf": [],
            },
            maxSize: MAX_FILE_SIZE,
            maxFiles: MAX_FILES_PER_UPLOAD,
        },
        shiftOnMaxFiles: false
    });

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        onUpload(dropzone.fileStatuses.map((fileStatus) => fileStatus.file));
        onOpenChange(false);
    }


    return (
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Subir resolución</DialogTitle>
            </DialogHeader>
            <div className="not-prose flex flex-col gap-4">
                <Dropzone {...dropzone}>
                    <div>
                        <div className="flex flex-col justify-between">
                            <DropzoneDescription>
                                Seleccioná hasta {MAX_FILES_PER_UPLOAD} archivos PDF
                                (máx. {filesize(MAX_FILE_SIZE, {standard: "jedec"})} c/u)
                            </DropzoneDescription>
                            <DropzoneMessage/>
                        </div>
                        <DropZoneArea>
                            <DropzoneTrigger
                                className="flex flex-col items-center gap-4 bg-transparent p-10 text-center text-sm">
                                <CloudUploadIcon className="size-8"/>
                                <div>
                                    <p className="font-semibold">Subir archivos</p>
                                    <p className="text-sm text-muted-foreground">
                                        Hacé click acá o arrastrá archivos para subirlos.
                                    </p>
                                </div>
                            </DropzoneTrigger>
                        </DropZoneArea>
                    </div>

                    <DropzoneFileList className="grid gap-3 p-0 md:grid-cols-2 lg:grid-cols-3">
                        {dropzone.fileStatuses.map((file) => (
                            <DropzoneFileListItem
                                className="overflow-hidden rounded-md bg-secondary p-0 shadow-sm"
                                key={file.id}
                                file={file}
                            >
                                <div className="flex items-center justify-between p-2 pl-4">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm">{file.fileName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {filesize(file.file.size, {standard: "jedec"})}
                                        </p>
                                    </div>
                                    <DropzoneRemoveFile
                                        variant="ghost"
                                        className="shrink-0 hover:outline"
                                    >
                                        <Trash2Icon className="size-4"/>
                                    </DropzoneRemoveFile>
                                </div>
                            </DropzoneFileListItem>
                        ))}
                    </DropzoneFileList>
                </Dropzone>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="button" onClick={handleSubmit}>Subir</Button>
            </DialogFooter>
        </DialogContent>
    )
}
