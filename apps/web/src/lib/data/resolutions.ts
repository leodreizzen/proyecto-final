import "server-only"
import prisma from "@/lib/prisma";
import {checkResourcePermission} from "@/lib/auth/data-authorization";
import {
    MissingResolution,
    ResolutionCounts,
    ResolutionNaturalID,
    ResolutionWithStatus
} from "@/lib/definitions/resolutions";
import {createDeleteAssetJob} from "@/lib/jobs/assets";
import {ResolutionFindManyArgs, v_MissingResolutionFindManyArgs} from "@repo/db/prisma/models";

export async function fetchResolutionsWithStatus(cursor: string | null, query?: string | null): Promise<ResolutionWithStatus[]> {
    await checkResourcePermission("resolution", "read");

    const cursorParams = cursor ? {
        skip: 1,
        cursor: {
            id: cursor
        }
    } satisfies Partial<ResolutionFindManyArgs> : {}

    const where = (query ? {
        search: {
            search_id: {
                contains: query.toUpperCase()
            }
        }
    } : {}) satisfies ResolutionFindManyArgs["where"];

    const resolutions = await prisma.resolution.findMany({
        ...cursorParams,
        where,
        take: 15,
        orderBy:[ {
            date: "desc"
        }, {
            year: "desc"
        }, {
            number: "desc"
        }, {
            initial: "asc"
        }]
    });
    return resolutions.map(resolution => ({
        ...resolution,
        status: "ok" //TODO
    }));
}

export async function fetchMissingResolutions(cursor: { initial: string, number: number, year: number } | null, query?: string | null): Promise<MissingResolution[]> {
    await checkResourcePermission("resolution", "read");

    const cursorParams = cursor ? {
        skip: 1,
        cursor: {
            initial_number_year: cursor
        }
    } : {}

    const where = (query ? {
        search_id: {
            contains: query.toUpperCase().trim()
        }
    } : {}) satisfies v_MissingResolutionFindManyArgs["where"];

    const missing = await prisma.v_MissingResolution.findMany({
        ...cursorParams,
        where,
        take: 15,
        orderBy: [
            { referencesCount: 'desc' },
            { year: 'desc' },
            { number: 'desc' }
        ]
    });

    return missing;
}

export async function countResolutions(): Promise<ResolutionCounts> {
    await checkResourcePermission("resolution", "read");
    const totalCount = await prisma.resolution.count();
    const missingCount = await prisma.v_MissingResolution.count();
    const inconsistentCount = 0; //TODO
    return {
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
    await checkResourcePermission("resolution", "read");
    return  prisma.resolution.findMany({
        where: { OR: resIds },
        select: { initial: true, number: true, year: true }
    });
}


export async function fetchLatestResolutions(limit: number){
    await checkResourcePermission("resolution", "read");
    return await prisma.resolution.findMany({
        orderBy: [
            { date: 'desc' },
            { year: 'desc' },
            { number: 'desc' }
        ],
        take: limit,
        select: {
            initial: true,
            number: true,
            year: true,
            date: true,
            summary: true,
        }
    });
}