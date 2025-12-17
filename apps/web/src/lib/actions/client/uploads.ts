import saveUploadedResolution, {getResolutionUploadUrl} from "@/lib/actions/server/uploads";
import {uploadFileToSignedURL} from "@/lib/file-storage/client";

export async function uploadResolutions(files: File[]) {
    for (const file of files) {
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
            console.error("Failed to get upload URL for file:", file.name);
            continue;
            // TODO handle error
        }

        const {url, key} = urlRes.data;
        await uploadFileToSignedURL(url, file);
        const saveRes = await saveUploadedResolution({key});
        if (!saveRes.success) {
            console.error("Failed to save uploaded resolution for file:", file.name);
            continue;
            // TODO handle error
        }
        else {
            console.log("Successfully uploaded and saved resolution for file:", file.name);
        }
    }
}