import axios from 'axios';

export async function uploadFileToSignedURL(signedURL: string, file: File, {onProgress}: {
    onProgress?: (progress: number) => void
} = {}): Promise<void> {
    await axios.put(signedURL, file, {
        headers: {
            'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                onProgress(progressEvent.loaded / progressEvent.total);
            }
        }
    });
}

