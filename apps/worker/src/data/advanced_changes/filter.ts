import prisma, {TransactionPrismaClient} from "@repo/db/prisma";
import {ChangeAdvancedOrderByWithRelationInput} from "@repo/db/prisma/models";

export async function filterResolutionsImpactedByAdvancedChanges(resolutions: string[], by_res: string[] | null, tx: TransactionPrismaClient = prisma): Promise<Map<string, string[]>> {
    const resIds = await tx.resolution.findMany({
        where: {
            id: {in: resolutions},
        },
        select: {
            id: true,
            initial: true,
            number: true,
            year: true
        }
    });

    const idMap = new Map<string, string>();
    for (const res of resIds) {
        idMap.set(`${res.initial}-${res.number}-${res.year}`, res.id);
    }

    const orderKeys = {
        resDate: "asc",
        resYear: "asc",
        resNumber: "asc",
        resInitial: "asc"
    } as const;
    const orderBy: ChangeAdvancedOrderByWithRelationInput[] = Object.entries(orderKeys).map(([attr, order]) => ({
        change: {
            articleModifier: {
                article: {
                    context: {
                        [attr]: order
                    }
                }
            }
        }
    }));


    const filtered = await tx.changeAdvanced.findMany({
        where: {
            target: {
                resolved: {
                    OR: resIds.map(r => ({
                        res_init: r.initial,
                        res_num: r.number,
                        res_year: r.year
                    }))
                }
            },
            ...(by_res !== null ? {
                change: {
                    articleModifier: {
                        article: {
                            context: {
                                rootResolutionId: {in: by_res}
                            }
                        }
                    }
                }
            } : {})

        },
        select: {
            id: true,
            target: {
                select: {
                    resolved: {
                        select: {
                            res_init: true,
                            res_num: true,
                            res_year: true
                        }
                    }
                }
            }
        },
        orderBy: orderBy
    });
    const changesMap = new Map<string, string[]>();
    for (const change of filtered) {
        const affectedResCoords = change.target.resolved;
        if (!affectedResCoords) continue;
        const affectedResId = idMap.get(`${affectedResCoords.res_init}-${affectedResCoords.res_num}-${affectedResCoords.res_year}`);
        if (!affectedResId) continue;

        if (!changesMap.has(affectedResId)) {
            changesMap.set(affectedResId, []);
        }
        changesMap.get(affectedResId)!.push(change.id);
    }
    return changesMap;
}