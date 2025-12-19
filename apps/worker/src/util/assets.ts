import {Asset} from "@repo/db/prisma/client";
import {getFileFromStorage} from "@/util/file-storage";

export async function fetchAsset(asset: Asset): Promise<Buffer> {
    return getFileFromStorage(asset.bucket, asset.path);
}