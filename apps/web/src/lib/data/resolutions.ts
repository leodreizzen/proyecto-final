import "server-only"
import prisma from "@/lib/prisma";
import {checkResourcePermission} from "@/lib/auth/data-authorization";
import {ResolutionWithStatus} from "@/lib/definitions/resolutions";
import {createDeleteAssetJob} from "@/lib/jobs/assets";

export async function fetchResolutionsWithStatus(): Promise<ResolutionWithStatus[]> {
    //TODO PAGINATION
    await checkResourcePermission("resolution", "read");

    const resolutions = await prisma.resolution.findMany({});
    return resolutions.map(resolution => ({
        ...resolution,
        status: "ok" //TODO
    }));
}

export async function countResolutions() {
    await checkResourcePermission("resolution", "read");
    return prisma.resolution.count();
}

export async function deleteResolutionById(resolutionId: string) {
    await checkResourcePermission("resolution", "delete");
    let assetId: string | undefined;
    await prisma.$transaction(async (tx) => {
        const res = await tx.resolution.delete({
            where: {id: resolutionId}
        })
        assetId = res.originalFileId;
        //TODO unify with worker version
        await tx.asset.update({
            where: {
                id: assetId
            },
            data: {
                deleted: true
            }
        })
    })
    await createDeleteAssetJob(assetId!)
}