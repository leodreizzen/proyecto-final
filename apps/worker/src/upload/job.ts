import {Job} from "bullmq";
import prisma, {TransactionPrismaClient} from "@repo/db/prisma";
import {parseResolution} from "@/parser/parser";
import {fetchAsset} from "@/util/assets";
import {saveParsedResolution} from "@/upload/save-resolution";
import {Asset} from "@repo/db/prisma/client";
import {createDeleteJob} from "@/job-creation";
import crypto from "crypto";
import {copyFileInStorage} from "@/util/file-storage";
import {AssetInclude} from "@repo/db/prisma/models";

export async function processResolutionUpload(job: Job) {
    const upload = await prisma.resolutionUpload.findUnique({
        where: {
            id: job.id,
        },
        include: {
            file: true,
        },
    });
    if (!upload) {
        throw new Error(`Upload with ID ${job.data.uploadId} not found`);
    }

    let publicFile: Asset | null = null;
    try {
        await prisma.resolutionUpload.update({
            where: {
                id: upload.id,
            },
            data: {
                status: 'PROCESSING',
            },
        })

        if (!upload.file) {
            throw new Error(`Upload with ID ${job.data.uploadId} has no associated file`);
        }

        const file = await fetchAsset(upload.file);


        const parseResult = await parseResolution(file);

        if (!parseResult.success) {
            // TODO handle error properly
            throw new Error(`Failed to parse resolution: ${JSON.stringify(parseResult.error)}`);
        }

        const createdFile = await makeResolutionFilePublic(upload.file, parseResult.data.id);
        publicFile = createdFile;

        await prisma.$transaction(async (tx) => {
            await saveParsedResolution(tx, parseResult.data, upload, createdFile);
            await tx.resolutionUpload.update({
                where: {
                    id: upload.id,
                },
                data: {
                    status: 'COMPLETED',
                    file: {
                        disconnect: true
                    }
                },
            })
        });
    } catch (e) {
        await prisma.resolutionUpload.update({
            where: {
                id: upload.id,
            },
            data: {
                status: 'FAILED',
            }
        });
        if (publicFile) {
            await deleteAsset(publicFile);
        }
        throw e
    }
    try {
        await deleteAsset(upload.file);
    } catch (e) {
        console.error("Failed to delete original upload file:", e);
        // don`t fail the job if deletion fails
    }
}

if (!process.env.S3_PUBLIC_BUCKET_NAME) {
    throw new Error("S3_PUBLIC_BUCKET_NAME is not defined");
}
const publicBucket = process.env.S3_PUBLIC_BUCKET_NAME;

async function makeResolutionFilePublic(file: Asset, resId: {
    initial: string,
    number: number,
    year: number
}): Promise<Asset> {
    const publicKey = `resolutions/${crypto.randomInt(1000)}-${resId.initial}/${resId.number.toString().padStart(5, '0')}-${resId.year}.pdf`;

    const publicFile = await prisma.asset.create({
        data: {
            bucket: publicBucket,
            path: publicKey,
            mimeType: file.mimeType,
            size: file.size,
            originalFileName: file.originalFileName,
        }
    });
    await copyFileInStorage(file.bucket, file.path, publicBucket, publicKey);
    return publicFile;
}

async function deleteAsset(file: Asset) {
    await prisma.$transaction(async (tx) => {
        if (!await checkAssetDeletable(tx, file)) {
            throw new Error("Asset is not deletable");
        }
        tx.asset.update({
            where: {
                id: file.id,
            }, data: {
                deleted: true,
            }
        })
    })

    await createDeleteJob(file)
}


async function checkAssetDeletable(tx: TransactionPrismaClient, file: Asset): Promise<boolean> {
    type AssetRelationsEnforcer = Record<keyof AssetInclude, unknown>;

    const relationsInclude = {
        resolutionUpload: {
            select: {id: true}
        },
        resolution: {
            select: {id: true}
        }
    } satisfies AssetInclude

    const _: AssetRelationsEnforcer = relationsInclude; // enforce all relations are included

    const assetUsage = await tx.asset.findUnique({
        where: {id: file.id},
        include: relationsInclude
    });

    if (!assetUsage) {
        throw new Error("Asset not found when checking deletable");
    }

    for (const key of Object.keys(relationsInclude)) {
        const relationKey = key as keyof typeof assetUsage;
        if (assetUsage[relationKey]) {
            return false;
        }
    }
    return true;
}

