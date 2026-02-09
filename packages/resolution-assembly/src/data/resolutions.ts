import prisma from "@repo/db/prisma";
import {ResolutionNaturalID} from "../definitions/resolutions";

export type ResolutionDBDataToShow = NonNullable<Awaited<ReturnType<typeof findResolutionInitialData>>>;

export async function findResolutionInitialData(resolutionId: string) {
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

export async function checkResolutionsExistance(resIds: ResolutionNaturalID[]) {
    return prisma.resolution.findMany({
        where: {OR: resIds},
        select: {initial: true, number: true, year: true}
    });
}