import {Asset} from "@repo/db/prisma/client";
import {copyFileInStorage, getFileFromStorage} from "@/util/file-storage";
import prisma, {TransactionPrismaClient} from "@repo/db/prisma";
import {createDeleteJob} from "@/job-creation";
import {AssetInclude} from "@repo/db/prisma/models";
import crypto from "crypto";

export async function fetchAsset(asset: Asset): Promise<Buffer> {
    return getFileFromStorage(asset.bucket, asset.path);
}

if (!process.env.S3_PUBLIC_BUCKET_NAME) {
    throw new Error("S3_PUBLIC_BUCKET_NAME is not defined");
}
const publicBucket = process.env.S3_PUBLIC_BUCKET_NAME;

export async function deleteAsset(file: Asset) {
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

export async function makeResolutionFilePublic(file: Asset, resId: {
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
