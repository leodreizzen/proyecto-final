import {AnnexChapterSelect, AnnexSelect, ArticleSelect, ChangeSelect, ReferenceSelect} from "@repo/db/prisma/models";
import {getRelevantChangeIds} from "@/lib/assembly/relevant-changes";
import prisma from "@/lib/prisma";
import {assign} from "@/lib/utils";

const referenceAllTargetsSelect: ReferenceSelect = {
    targetType: true,
    resolution: true, // referenceResolution
    article: true, // referenceArticle
    annex: true, // referenceAnnex
    chapter: true, // referenceChapter
}

const annexParentSelect = {
    resolution: {
        select: {
            id: true
        }
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

const chapterParentSelect = {
    annex: {
        select: {
            annex: {
                select: {
                    id: true,
                    ...annexParentSelect
                }
            }
        }
    }
} as const satisfies AnnexChapterSelect;

const articleParentSelect = {
    id: true,
    resolution: {
        select: {
            id: true
        }
    },
    annex: { // annexWithArticles
        select: {
            annex: {
                select: {
                    id: true,
                    ...annexParentSelect
                }
            }
        }
    },
    chapter: {
        select: {
            id: true,
            ...chapterParentSelect
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
                select: articleParentSelect
            }
        }
    },
} as const satisfies ChangeSelect;


export async function getChangesForValidityGraph(uuid: string) {
    //TODO authckeck
    const changeIds = await getRelevantChangeIds(uuid);

    /*
        Get:
        - All ancestors.
        - If change affects validity, its target (concrete reference)
        - If change creates an entity, its id, target, and number/suffix in destination
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
                    targetArticle: true, // referenceArticle
                    newContent: {
                        select: {
                            id: true
                        }
                    }
                }
            },
            changeReplaceAnnex: {
                select: {
                    targetAnnex: true, // referenceAnnex
                    newContentType: true,
                    newAnnexReference: true, // referenceAnnex
                    newInlineAnnex: {
                        select: {
                            id: true
                        }
                    }
                }
            },
            changeAddAnnex: {
                select: {
                    annexToAdd: true, // referenceAnnex
                    targetResolution: true, // referenceResolution
                    targetAnnex: true, // referenceAnnex
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
                    targetResolution: true, // referenceResolution
                    targetAnnex: true, // referenceAnnex
                    targetChapter: true // referenceChapter
                }
            },
            changeApplyModificationsAnnex: {
                select: {
                    annexToApply: true // referenceAnnex
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

    const changesWithAncestors = await Promise.all(changes.map(async ch => {
        const article = ch.articleModifier.article;
        let mappedArticle;
        if (article.addedByChange) {
            const addedById = article.addedByChange.change.id;
            mappedArticle = assign(article, ['addedByChange', 'change'],
                {
                    id: addedById,
                    ...(await getChangeAncestors(addedById))
                });
        } else if (article.newContentFrom) {
            const newContentFromId = article.newContentFrom.change.id;
            mappedArticle = assign(article, ['newContentFrom', 'change'], {
                id: newContentFromId,
                ...(await getChangeAncestors(newContentFromId))
            })
        } else if (article.chapter) {
            const chapter = article.chapter;
            const parentAnnex = chapter.annex.annex;
            if (parentAnnex.newContentForChangeReplaceAnnex) {
                const newContentFromId = parentAnnex.newContentForChangeReplaceAnnex.change.id;
                mappedArticle = assign(article, ["chapter", "annex", "annex", "newContentForChangeReplaceAnnex", "change"], {
                    id: newContentFromId,
                    ...(await getChangeAncestors(newContentFromId))
                });
            } else
                mappedArticle = article;
        } else if (article.annex) {
            const parentAnnex = article.annex.annex;
            if (parentAnnex.newContentForChangeReplaceAnnex) {
                const newContentFromId = parentAnnex.newContentForChangeReplaceAnnex.change.id;

                mappedArticle = assign(article, ["annex", "annex", "newContentForChangeReplaceAnnex", "change"], {
                    id: newContentFromId,
                    ...(await getChangeAncestors(newContentFromId))
                });
            } else
                mappedArticle = article;
        } else {
            mappedArticle = article;
        }
        if (!mappedArticle) {
            const _guard: never = mappedArticle;
            throw new Error("Unreachable code reached in change ancestor mapping");
        }
        return assign(ch, ["articleModifier", "article"], mappedArticle);
    }));

    // TODO RECURSIVE CASE
    return changesWithAncestors;
}


async function getChangeAncestors(changeId: string) {
    const res = await prisma.change.findUnique({
        where: {
            id: changeId
        },
        select: changeParentSelect
    })

    if (!res) {
        throw new Error("Change not found: " + changeId);
    }
    return res;
}

async function getAnnexAnestors(annexId: string) {
    const res = await prisma.annex.findUnique({
        where: {
            id: annexId
        },
        select: annexParentSelect
    });
    if (!res) {
        throw new Error("Annex not found: " + annexId);
    }
    return res;
}
