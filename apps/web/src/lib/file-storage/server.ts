import "server-only"
import {HeadObjectCommand, PutObjectCommand, S3Client} from "@aws-sdk/client-s3"
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";

if (!process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY) {
    throw new Error("S3 credentials are not set in environment variables")
}
if (!process.env.S3_ENDPOINT) {
    throw new Error("S3 endpoint is not set in environment variables")
}
if (!process.env.S3_REGION) {
    throw new Error("S3 region is not set in environment variables")
}
if (!process.env.PUBLIC_S3_ENDPOINT) {
    throw new Error("Public S3 endpoint is not set in environment variables")
}

const s3Config = {
    region: process.env.S3_REGION,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
    },
    forcePathStyle: true,
}

const publicS3Endpoint = process.env.PUBLIC_S3_ENDPOINT;
const publicS3APIUrl = new URL(publicS3Endpoint);
const s3Signer = new S3Client({
    ...s3Config,
    endpoint: publicS3APIUrl.origin,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
})

const s3Client = new S3Client({
    ...s3Config,
    endpoint: process.env.S3_ENDPOINT,
})

function rewriteS3URL(url: string) {
    return url.replace(publicS3APIUrl.origin, publicS3Endpoint)
}


export async function signUploadURL(bucket: string, key: string, fileSize: number, contentType: string) {
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: fileSize,
        ChecksumAlgorithm: undefined,
    });
    const signedUrl = await getSignedUrl(s3Signer, command, {expiresIn: 300});
    return rewriteS3URL(signedUrl);
}

export async function checkFileExistsInStorage(bucket: string, key: string): Promise<boolean> {
    try {
        const headParams = {Bucket: bucket, Key: key};
        await s3Client.send(new HeadObjectCommand(headParams));
        return true;
    } catch {
        return false;
    }
}