import prisma from "@/lib/prisma";
import {AnnexInclude, ArticleInclude} from "@repo/db/prisma/models";
import {checkConcreteChange} from "@/lib/data/polymorphism/change";

export type ChangeDataForAssembly = Awaited<ReturnType<typeof fetchChangesDataForAssembly>>[number];

export async function fetchChangesDataForAssembly(changeIds: string[]) {
    const articleInclude = {
        tables: true
    } as const satisfies ArticleInclude;

    const annexInclude = {
        annexText: {
            include: {
                tables: true
            }
        }, annexWithArticles: {
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
                    targetArticle: true
                }
            },
            changeReplaceArticle: {
                include: {
                    targetArticle: true,
                    newContent: {
                        include: articleInclude
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
            changeApplyModificationsAnnex: {
            },
            changeAdvanced: {
            }
        }
    });
    return changes.map(checkConcreteChange);
}
