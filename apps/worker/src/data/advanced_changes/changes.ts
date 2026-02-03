import prisma from "@repo/db/prisma";

export async function fetchAdvancedChangeForTask(changeId: string) {
    const change = await prisma.changeAdvanced.findUnique({
        where: {
            id: changeId,
        },
        include: {
            change: {
                select: {
                    articleModifier: {
                        select: {
                            changes: {
                                select: {
                                    id: true
                                },
                                where: {
                                    id: {
                                        not: changeId
                                    }
                                }
                            },
                            article: {
                                select: {
                                    context: {
                                        select: {
                                            resDate: true,
                                            rootResolutionId: true,
                                            resInitial: true,
                                            resNumber: true,
                                            resYear: true
                                        }
                                    },
                                    id: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    if (!change) {
        return null;
    }

    const changeContext = change.change.articleModifier.article.context;
    if (!changeContext) {
        throw new Error(`Change context for change ID ${changeId} not found.`);
    }

    const articleModifierId = change.change.articleModifier.article.id;
    const date = changeContext.resDate;
    const rootResolutionId = changeContext.rootResolutionId;
    const otherChanges = change.change.articleModifier.changes.map(c => c.id);

    return  {
        date,
        rootResolutionId,
        rootResolutionCoords: {
            initial: changeContext.resInitial,
            number: changeContext.resNumber,
            year: changeContext.resYear
        },
        otherChanges,
        articleModifierId
    }
}