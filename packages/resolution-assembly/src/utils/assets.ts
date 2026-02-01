import {Asset} from "@repo/db/prisma/client";

// TODO: move to a dedicated asset package
export function getDownloadUrl(asset: Asset) {
    return `/assets/${asset.bucket}/${asset.path}`;
}
