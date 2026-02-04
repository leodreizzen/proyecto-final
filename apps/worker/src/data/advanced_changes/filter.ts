import prisma, { TransactionPrismaClient } from "@repo/db/prisma";
import {ChangeAdvancedOrderByWithRelationInput, ChangeAdvancedWhereInput} from "@repo/db/prisma/models";
import { EvaluateImpactPayload } from "@repo/jobs/maintenance/schemas";
import { compareChangeWithContext } from "@repo/resolution-assembly";
import { ChangeWithIDAndContext } from "@repo/resolution-assembly/definitions/changes";

export async function filterResolutionsImpactedByAdvancedChanges(
    resolutions: string[],
    by_res: string[] | null,
    cutoff: EvaluateImpactPayload["cutoff"] | undefined,
    subjectResolutionId: string | undefined, // The resolution we are currently processing (for inverse deps)
    tx: TransactionPrismaClient = prisma
): Promise<Map<string, string[]>> {
    const resIds = await tx.resolution.findMany({
        where: {
            id: { in: resolutions },
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

    const targetFilter = {
        target: {
            resolved: {
                OR: resIds.map(r => ({
                    res_init: r.initial,
                    res_num: r.number,
                    res_year: r.year
                }))
            }
        }
    };

    let whereFinal: ChangeAdvancedWhereInput = targetFilter;

    if (by_res !== null) {
        const sourceFilter = {
            change: {
                articleModifier: {
                    article: {
                        context: {
                            rootResolutionId: { in: by_res }
                        }
                    }
                }
            }
        };

        if (subjectResolutionId) {
            // Inverse dependency logic:
            // Relax source filter if the TARGET is the subjectResolutionId.
            const subjectRes = resIds.find(r => r.id === subjectResolutionId);
            if (subjectRes) {
                whereFinal = {
                    AND: [
                        targetFilter,
                        {
                            OR: [
                                sourceFilter,
                                {
                                    target: {
                                        resolved: {
                                            res_init: subjectRes.initial,
                                            res_num: subjectRes.number,
                                            res_year: subjectRes.year
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                };
            } else {
                whereFinal = {
                    AND: [targetFilter, sourceFilter]
                };
            }
        } else {
            whereFinal = {
                AND: [targetFilter, sourceFilter]
            };
        }
    }


    const filtered = await tx.changeAdvanced.findMany({
        where: whereFinal,
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
            },
            change: {
                select: {
                    articleModifier: {
                        select: {
                            article: {
                                select: {
                                    context: {
                                        select: {
                                            rootResolutionId: true,
                                            rootResolution: {
                                                select: {
                                                    initial: true,
                                                    number: true,
                                                    year: true,
                                                }
                                            },
                                            resDate: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        orderBy: orderBy
    });

    const changesWithContext = filtered.map(c => {
        const ctx = c.change.articleModifier.article.context;
        if (!ctx) return null;
        return {
            id: c.id,
            context: {
                date: ctx.resDate,
                rootResolution: {
                    initial: ctx.rootResolution.initial,
                    number: ctx.rootResolution.number,
                    year: ctx.rootResolution.year
                },
                structuralElement: {
                    articleNumber: null,
                    articleSuffix: null,
                    annexNumber: null,
                    chapterNumber: null
                }
            }
        } satisfies ChangeWithIDAndContext;
    }).filter((c: ChangeWithIDAndContext | null): c is ChangeWithIDAndContext => c !== null) as ChangeWithIDAndContext[];

    let validChanges = changesWithContext;
    if (cutoff) {
        // Cutoff logic:
        // 1. Fetch resolution details from DB using cutoff.resolutionId
        // 2. If found, use `sortChangeWithContext`.
        // 3. If NOT found (deleted?), use fallback `date` comparison.

        const cutoffRes = await tx.resolution.findUnique({
            where: { id: cutoff.resolutionId },
            select: {
                initial: true,
                number: true,
                year: true
            }
        });

        if (cutoffRes) {
            const cutoffChange: ChangeWithIDAndContext = {
                id: '\uffffcutoff', // Ensure it's treated as the highest ID if all else equal
                context: {
                    date: cutoff.date,
                    rootResolution: {
                        initial: cutoffRes.initial,
                        number: cutoffRes.number,
                        year: cutoffRes.year
                    },
                    structuralElement: {
                        articleNumber: null,
                        articleSuffix: null,
                        annexNumber: null,
                        chapterNumber: null
                    }
                }
            };
            validChanges = validChanges.filter(c => compareChangeWithContext(c, cutoffChange) > 0);
        } else {
            console.warn(`Cutoff resolution ${cutoff.resolutionId} not found. Falling back to simple date comparison.`);
            // Fallback: strictly newer date
            validChanges = validChanges.filter(c => c.context.date.getTime() > cutoff.date.getTime());
        }
    }

    const changesMap = new Map<string, string[]>();
    for (const changeCtx of validChanges) {
        const originalChange = filtered.find(c => c.id === changeCtx.id);
        if (!originalChange) continue;

        const affectedResCoords = originalChange.target.resolved;
        if (!affectedResCoords) continue;
        const affectedResId = idMap.get(`${affectedResCoords.res_init}-${affectedResCoords.res_num}-${affectedResCoords.res_year}`);
        if (!affectedResId) continue;

        if (!changesMap.has(affectedResId)) {
            changesMap.set(affectedResId, []);
        }
        changesMap.get(affectedResId)!.push(originalChange.id);
    }
    return changesMap;
}