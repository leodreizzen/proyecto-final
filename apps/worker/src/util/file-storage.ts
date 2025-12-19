import {CopyObjectCommand, GetObjectCommand, S3Client} from "@aws-sdk/client-s3"

if (!process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY) {
    throw new Error("S3 credentials are not set in environment variables")
}
if (!process.env.S3_ENDPOINT) {
    throw new Error("S3 endpoint is not set in environment variables")
}
if (!process.env.S3_REGION) {
    throw new Error("S3 region is not set in environment variables")
}

const s3Client = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
    },
    forcePathStyle: true,
    endpoint: process.env.S3_ENDPOINT,
})

export async function getFileFromStorage(bucket: string, key: string): Promise<Buffer> {
    const command = new GetObjectCommand({Bucket: bucket, Key: key});
    const response = await s3Client.send(command);
    if (!response.Body) {
        throw new Error(`Empty body received for s3://${bucket}/${key}`);
    }
    const bytes = await response.Body.transformToByteArray();
    return Buffer.from(bytes);
}

export async function copyFileInStorage(sourceBucket: string, sourceKey: string, destinationBucket: string, destinationKey: string): Promise<void> {
    const copyCommand = new CopyObjectCommand({
        Bucket: destinationBucket,
        Key: destinationKey,
        CopySource: `${sourceBucket}/${sourceKey}`,
    });
    await s3Client.send(copyCommand);
}