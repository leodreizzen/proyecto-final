import {
    AnnexChapterSelect,
    AnnexSelect,
    ArticleSelect,
    ChangeSelect,
    ReferenceSelect,
    ResolutionSelect
} from "@repo/db/prisma/models";
import prisma from "@repo/db/prisma";
import {ChangeContext} from "../definitions/changes";
import {checkConcreteChange} from "@repo/db/utils/polymorphism/change";


const resolutionSelect = {
    id: true,
    initial: true,
    number: true,
    year: true
} as const satisfies ResolutionSelect;

const annexWithParentSelect = {
    id: true,
    number: true,
    resolution: {
        select: resolutionSelect
    },
    newContentForChangeReplaceAnnex: {
        select: {
            change: {
                select: {
                    id: true
                }
            },
            targetAnnex: {
                select: {
                    annexId: true
                }
            }
        }
    }
} as const satisfies AnnexSelect

const chapterWithParentSelect = {
    id: true,
    number: true,
    annex: {
        select: {
            annex: {
                select: {
                    ...annexWithParentSelect
                }
            }
        }
    }
} as const satisfies AnnexChapterSelect;
const articleWithParentsSelect = {
    id: true,
    number: true,
    suffix: true,
    resolution: {
        select: resolutionSelect
    },
    annex: { // annexWithArticles
        select: {
            annex: {
                select: {
                    ...annexWithParentSelect
                }
            }
        }
    },
    chapter: {
        select: {
            ...chapterWithParentSelect
        }
    },
    addedByChange: {
        select: {
            change: {
                select: {
                    id: true
                }
            }
        }
    },
    newContentFrom: {
        select: {
            change: {
                select: {
                    id: true
                }
            }
        }
    }
} as const satisfies ArticleSelect;

const changeParentSelect = {
    articleModifier: {
        select: {
            article: {
                select: articleWithParentsSelect
            }
        }
    },
} as const satisfies ChangeSelect;


const targetResolutionReferenceData = {
    include: {
        resolution: {
            select: resolutionSelect
        }
    }
} as const;

const targetArticleReferenceData = {
    include: {
        article: {
            select: articleWithParentsSelect
        }
    }
} as const;

const targetAnnexReferenceData = {
    include: {
        annex: {
            select: annexWithParentSelect
        }
    }
} as const;

const targetChapterReferenceData = {
    include: {
        chapter: {
            select: chapterWithParentSelect
        }
    }
} as const;

const newAnnexContentSelect = {
        id: true,
        type: true,
        annexWithArticles: {
            select: {
                standaloneArticles: {
                    select: {
                        id: true,
                        number: true,
                        suffix: true
                    }
                }, chapters: {
                    select: {
                        id: true,
                        number: true,
                        articles: {
                            select: {
                                id: true,
                                number: true,
                                suffix: true
                            }
                        }
                    }
                }
            }
        }
} as const satisfies AnnexSelect;

const referenceAllTargetsSelect = {
    targetType: true,
    resolution: targetResolutionReferenceData, // referenceResolution
    article: targetArticleReferenceData, // referenceArticle
    annex: targetAnnexReferenceData, // referenceAnnex
    chapter: targetChapterReferenceData, // referenceChapter
} as const satisfies ReferenceSelect


export async function getChangesDataForValidityGraph(changeIds: string[], contexts: Map<string, ChangeContext>) {

    /*
    Get:
    - All ancestors.
    - If change affects validity, its target (concrete reference). If target has a native version, its ancestors as well.
    - If change creates an entity, its id, target, and number/suffix in destination, plus all children
    */

    const changes = await prisma.change.findMany({
        where: {
            id: {in: changeIds}
        },
        select: {
            id: true,
            type: true,
            ...changeParentSelect,

            changeReplaceArticle: {
                select: {
                    targetArticle: targetArticleReferenceData, // referenceArticle
                    newContent: {
                        select: {
                            id: true
                        }
                    }
                }
            },
            changeReplaceAnnex: {
                select: {
                    targetAnnex: targetAnnexReferenceData, // referenceAnnex
                    newContentType: true,
                    newAnnexReference: {
                        include: {
                            annex: {
                                select: newAnnexContentSelect
                            }
                        }
                    }, // referenceAnnex
                    newInlineAnnex: {
                        select: newAnnexContentSelect
                    }
                }
            },
            changeAddAnnex: {
                select: {
                    annexToAdd: {
                        include: {
                            annex: {
                                select: newAnnexContentSelect
                            }
                        }
                    }, // referenceAnnex
                    targetResolution: targetResolutionReferenceData, // referenceResolution
                    targetAnnex: targetAnnexReferenceData, // referenceAnnex
                    newAnnexNumber: true
                }
            },
            changeAddArticle: {
                select: {
                    newArticle: {
                        select: {
                            id: true
                        }
                    },
                    newArticleNumber: true,
                    newArticleSuffix: true,
                    targetResolution: targetResolutionReferenceData, // referenceResolution
                    targetAnnex: targetAnnexReferenceData, // referenceAnnex
                    targetChapter: targetChapterReferenceData // referenceChapter
                }
            },
            changeApproveAnnex: {
                select: {
                    annexToApprove: {
                        include: {
                            annex: {
                                select: newAnnexContentSelect
                            }
                        }
                    } // referenceAnnex
                }
            },
            changeRepeal: {
                select: {
                    target: {
                        select: referenceAllTargetsSelect
                    }
                }
            },
            changeModifyArticle: {
                // select nothing, just check existence
            },
            changeRatifyAdReferendum: {
                // select nothing, just check existence
            },
            changeAdvanced: {
                // select nothing, just check existence
            },
            changeModifyTextAnnex: {
                // select nothing, just check existence
            },
        }
    })
    return changes.map(change => {
        const context = contexts.get(change.id);
        const checkedChange = checkConcreteChange(change);
        if (!context) throw new Error("Context missing for change " + change.id);
        const date = context.date;
        return {
            ...checkedChange,
            date
        }
    });
}