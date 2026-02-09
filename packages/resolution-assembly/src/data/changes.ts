import prisma from "@repo/db/prisma";
import {AnnexInclude, ArticleInclude, ContentBlockInclude} from "@repo/db/prisma/models";
import {checkConcreteChange} from "@repo/db/utils/polymorphism/change";
import {ResolutionNaturalID} from "../definitions/resolutions";

export type ChangeDataForAssembly = Awaited<ReturnType<typeof fetchChangesDataForAssembly>>[number];

export async function fetchChangesDataForAssembly(changeIds: string[]) {
    const contentBlocksInclude = {
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
    } as const satisfies ContentBlockInclude;

    const contentBlocksData = {
        include: contentBlocksInclude,
        orderBy: {
            order: 'asc' as const
        }
    }

    const articleInclude = {
        content: contentBlocksData
    } as const satisfies ArticleInclude;

    const annexInclude = {
        annexText: {
            include: {
                content: contentBlocksData
            }
        },
        annexWithArticles: {
            include: {
                chapters: {
                    include: {
                        articles: {
                            include: articleInclude
                        }
                    }
                },
                standaloneArticles: {
                    include: articleInclude
                }
            }
        }
    } as const satisfies AnnexInclude

    const changes = await prisma.change.findMany({
        where: {
            id: {in: changeIds}
        },
        include: {
            changeModifyArticle: {
                include: {
                    targetArticle: true,
                    before: {
                        include: contentBlocksInclude,
                        orderBy: {order: 'asc'}
                    },
                    after: {
                        include: contentBlocksInclude,
                        orderBy: {order: 'asc'}
                    }
                }
            },
            changeReplaceArticle: {
                include: {
                    targetArticle: true,
                    newContent: {
                        include: articleInclude,
                    }
                }
            },
            changeRatifyAdReferendum: {
                include: {
                    targetResolution: true
                }
            },
            changeReplaceAnnex: {
                include: {
                    targetAnnex: true,
                    newInlineAnnex: {
                        include: annexInclude
                    },
                    newAnnexReference: {
                        include: {
                            annex: {
                                include: annexInclude
                            }
                        }
                    }
                }
            },
            changeAddAnnex: {
                include: {
                    annexToAdd: {
                        include: {
                            annex: {
                                include: annexInclude
                            }
                        }
                    },
                    targetResolution: true,
                    targetAnnex: true
                }
            },
            changeModifyTextAnnex: {
                include: {
                    targetAnnex: true,
                    before: {
                        include: contentBlocksInclude,
                        orderBy: {order: 'asc'}
                    },
                    after: {
                        include: contentBlocksInclude,
                        orderBy: {order: 'asc'}
                    }
                }
            },
            changeAddArticle: {
                include: {
                    targetResolution: true,
                    targetAnnex: true,
                    targetChapter: true,
                    newArticle: {
                        include: articleInclude
                    }
                }
            },
            changeRepeal: {
                include: {
                    target: {
                        include: {
                            resolution: true,
                            annex: true,
                            chapter: true,
                            article: true
                        }
                    }
                }
            },
            changeApproveAnnex: {},
            changeAdvanced: {
                include: {
                    target: {
                        include: {
                            resolution: true,
                            annex: true,
                            chapter: true,
                            article: true
                        }
                    }
                }
            }
        }
    });
    return changes.map(checkConcreteChange);
}


export async function fetchChangesRootResolutionIds(changeIds: string[]): Promise<Map<string, ResolutionNaturalID>> {
    const queryRes = await prisma.change.findMany({
        where: {
            id: {in: changeIds}
        },
        select: {
            id: true,
            articleModifier: {
                select: {
                    article: {
                        select: {
                            context: {
                                select: {
                                    resInitial: true,
                                    resNumber: true,
                                    resYear: true
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    const result = new Map<string, ResolutionNaturalID>();
    for (const change of queryRes) {
        const context = change.articleModifier?.article.context;
        if (context) {
            result.set(change.id, {
                initial: context.resInitial,
                number: context.resNumber,
                year: context.resYear
            });
        }
    }
    return result;
}