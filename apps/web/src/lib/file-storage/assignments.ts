import "server-only"

if (!process.env.S3_INTERNAL_BUCKET_NAME) {
    throw new Error("S3_PUBLIC_BUCKET_NAME is not set in environment variables");
}

export const RESOLUTION_UPLOAD_BUCKET = process.env.S3_INTERNAL_BUCKET_NAME;

export function resolutionUploadKey(fileName: string): string {
    const fileNameSanitized = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    if (!fileNameSanitized.endsWith(".pdf")) {
        throw new Error("Only PDF files are allowed for resolution uploads");
    }
    const timestamp = Date.now();
    return `uploads/resolutions/${timestamp}-${fileNameSanitized}`;
}