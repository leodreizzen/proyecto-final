import axios, {GenericAbortSignal} from 'axios';

export async function uploadFileToSignedURL(signedURL: string, file: File, {onProgress, abortSignal}: {
    onProgress?: (progress: number) => void
    abortSignal?: GenericAbortSignal
} = {}): Promise<void> {
    await axios.put(signedURL, file, {
        headers: {
            'Content-Type': file.type,
        },
        signal: abortSignal,
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                onProgress(progressEvent.loaded / progressEvent.total);
            }
        }
    });
}

