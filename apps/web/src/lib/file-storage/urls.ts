import {Asset} from "@repo/db/prisma/client";

export function getDownloadUrl(asset: Asset) {
    return `/assets/${asset.bucket}/${asset.path}`;
}