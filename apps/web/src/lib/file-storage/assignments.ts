import "server-only"

if (!process.env.S3_INTERNAL_BUCKET_NAME) {
    throw new Error("S3_PUBLIC_BUCKET_NAME is not set in environment variables");
}

export const RESOLUTION_UPLOAD_BUCKET = process.env.S3_INTERNAL_BUCKET_NAME;

export function resolutionUploadKey(fileName: string): string {
    const timestamp = Date.now();
    return `uploads/resolutions/${timestamp}-${fileName}`;
}