import "server-only"
import prisma from "@/lib/prisma";
import {checkResourcePermission} from "@/lib/auth/data-authorization";
import {ResolutionCounts, ResolutionNaturalID, ResolutionWithStatus} from "@/lib/definitions/resolutions";
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

export async function countResolutions(): Promise<ResolutionCounts> {
    await checkResourcePermission("resolution", "read");
    const totalCount = await prisma.resolution.count();
    const okCount = 0; //TODO
    const missingCount = 0; //TODO
    const inconsistentCount = 0; //TODO
    return {
        ok: okCount,
        total: totalCount,
        missingRef: missingCount,
        inconsistent: inconsistentCount
    }
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

export async function getResolutionIdByNaturalKey(key: {initial: string, number: number, year: number}): Promise<string | null> {
    await checkResourcePermission("resolution", "read");
    const res = await prisma.resolution.findFirst({
        where: {
            initial: key.initial,
            number: key.number,
            year: key.year
        },
        select: {
            id: true
        }
    });
    return res?.id ?? null;
}


export type ResolutionDBDataToShow = NonNullable<Awaited<ReturnType<typeof fetchResolutionInitialData>>>;

export async function fetchResolutionInitialData(resolutionId: string) {
    await checkResourcePermission("resolution", "read");
    const contentInclude = {
        include: {
            content: {
                include: {
                    references: {
                        include: {
                            reference: {
                                include: {
                                    resolution: true,
                                    article: true,
                                    annex: true,
                                    chapter: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    order: 'asc' as const
                }
            }
        }
    } as const;

    const res = await prisma.resolution.findUnique({
        where: {
            id: resolutionId
        },
        include: {
            recitals: contentInclude,
            considerations: contentInclude,
            articles: contentInclude,
            annexes: {
                include: {
                    annexWithArticles: {
                        include: {
                            standaloneArticles: contentInclude,
                            chapters: {
                                include: {
                                    articles: contentInclude
                                }
                            }
                        }
                    },
                    annexText: contentInclude
                }
            },
            originalFile: true
        }
    });
    return res;
}

export async function checkResolutionsExistance(resIds: ResolutionNaturalID[]){
    return  prisma.resolution.findMany({
        where: { OR: resIds },
        select: { initial: true, number: true, year: true }
    });
}