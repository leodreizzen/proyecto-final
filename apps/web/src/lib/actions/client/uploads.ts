import saveUploadedResolution, {getResolutionUploadUrl} from "@/lib/actions/server/uploads";
import {uploadFileToSignedURL} from "@/lib/file-storage/client";
import {showUploadFinishedToast, showUploadToast} from "@/components/admin/UploadToasts";
import {v4} from "uuid";
import axios from "axios";

export async function uploadResolutions(files: File[], abortController?: AbortController) {
    const clientUploadId = v4();
    const results: {
        fileName: string,
        status: "success" | "error" | "cancelled"
    }[] = [];

    for (const [index, file] of files.entries()) {
        if (abortController?.signal.aborted) {
            results.push({fileName: file.name, status: "cancelled"});
            break;
        }
        try {
            const showProgress = (progress: number) => {
                showUploadToast({
                    id: clientUploadId,
                    totalFiles: files.length,
                    currentFile: {
                        name: file.name,
                        index: index,
                        progress: progress * 100
                    },
                    errorCount: results.filter(r => r.status === "error").length
                });
            };

            showProgress(0);

            if (file.type !== "application/pdf") {
                console.error("Invalid file type for file:", file.name);
                continue;
            }
            const urlRes = await getResolutionUploadUrl({
                fileType: file.type,
                fileName: file.name,
                fileSize: file.size
            })
            if (!urlRes.success) {
                throw new Error("Failed to get upload URL for file: " + file.name);
            }

            const {url, key} = urlRes.data;
            await uploadFileToSignedURL(url, file, {
                onProgress: showProgress,
                abortSignal: abortController?.signal
            });

            const saveRes = await saveUploadedResolution({key});

            if (!saveRes.success) {
                throw new Error("Failed to save uploaded resolution:" + saveRes.error);
            }

            results.push({fileName: file.name, status: "success"});
        } catch (error) {
            if (axios.isCancel(error)) {
                console.warn("Upload cancelled for file:", file.name);
                results.push({fileName: file.name, status: "cancelled"});
                break; // Exit the loop if upload is cancelled
            }

            console.error("Error uploading file:", file.name, error);
            results.push({fileName: file.name, status: "error"});
        }
    }
    showUploadFinishedToast({id: clientUploadId, results});
}
