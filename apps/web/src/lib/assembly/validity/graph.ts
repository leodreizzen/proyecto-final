import {getChangesForValidityGraph} from "@/lib/assembly/validity/data";
import {ChangeType, ReferenceTargetType} from "@repo/db/prisma/enums";
import _stringify from "json-stable-stringify";
import {DistributiveOmit} from "@/lib/definitions/util";
import {ReferenceAnnex, ReferenceArticle, ReferenceChapter} from "@repo/db/prisma/client";

function stringify(obj: object): string {
    return _stringify(obj)!;
}

async function getValidRelevantChanges(uuid: string) {
    const _changes = await getChangesForValidityGraph(uuid);
    const changes = _changes.map(change => checkConcreteChange(change));

    const nodeMap = new Map<string, ValidityGraphNode>();

    type ChangeForGraph = typeof changes[number];
    type ArticleForGraph = ChangeForGraph["articleModifier"]["article"];

    type AnnexForGraph = NonNullable<ArticleForGraph["annex"]>["annex"];
    type ChapterForGraph = NonNullable<ArticleForGraph["chapter"]>;
    type ResolutionForGraph = NonNullable<ArticleForGraph["resolution"]>;
    type Reference = NonNullable<ChangeForGraph["changeRepeal"]>["target"];

    const changeKey = (changeId: string) => "change-" + changeId;
    const articleKey = (articleId: string) => "article-" + articleId;
    const annexKey = (annexId: string) => "annex-" + annexId;
    const chapterKey = (chapterId: string) => "chapter-" + chapterId;
    const resolutionKey = (resolutionId: string) => "resolution-" + resolutionId;

    type ResId = {
        initial: string,
        number: number,
        year: number
    }

    type NewVirtualAnnexParams = DistributiveOmit<ReferenceAnnex, "annexNumber"> & {
        newAnnexNumber: number | null
    }

    function defaultNewAnnexnumber() {
        //TODO
        return 100;
    }

    function defaultNewArticleNumberAndSuffix() {
        //TODO
        return {
            number: 200,
            suffix: 0
        };
    }


    const virtualAnnexCreationKey = (params: NewVirtualAnnexParams) => {
        const newAnnexNumber = params.newAnnexNumber === null ? defaultNewAnnexnumber() : params.newAnnexNumber;
        return virtualAnnexKey({...params, annexNumber: newAnnexNumber});
    }

    const virtualAnnexKey = (params: ReferenceAnnex) => {
        return stringify({...params, keyType: "virtual annex"});
    }

    const virtualChapterKey = (params: ReferenceChapter) => {
        return stringify({...params, keyType: "virtual chapter"});
    }

    type NewVirtualArticleParams = DistributiveOmit<ReferenceArticle, "articleNumber" | "articleSuffix"> & {
        newArticleNumber: number | null,
        newArticleSuffix: number | null
    }

    const virtualArticleCreationKey = (params: NewVirtualArticleParams) => {
        let newArticleNumber;
        let newArticleSuffix;
        if (params.newArticleNumber === null) {
            const defaultInfo = defaultNewArticleNumberAndSuffix();
            newArticleNumber = defaultInfo.number;
            newArticleSuffix = defaultInfo.suffix;
        } else if (params.newArticleSuffix === null) {
            newArticleNumber = params.newArticleNumber;
            newArticleSuffix = 0;
        } else {
            newArticleNumber = params.newArticleNumber;
            newArticleSuffix = params.newArticleSuffix;
        }

        return virtualArticleKey({...params, articleNumber: newArticleNumber, articleSuffix: newArticleSuffix});
    }

    const virtualArticleKey = (params: ReferenceArticle) => {
        return stringify({...params, keyType: "virtual article"});
    }


    function addChange(change: ChangeForGraph): ValidityGraphNode | undefined {
        const existingNode = nodeMap.get(changeKey(change.id));
        if (existingNode) {
            return existingNode;
        }

        const parent = change.articleModifier.article;

        const parentNode = addArticle(parent);
        if (!parentNode) {
            return undefined;
        }

        const changeNode = new ValidityGraphNode({
            parent: parentNode,
        });
        nodeMap.set("change-" + change.id, changeNode);
        return changeNode;
    }

    function addArticle(article: ArticleForGraph): ValidityGraphNode | undefined {
        const existingNode = nodeMap.get(articleKey(article.id));
        if (existingNode) {
            return existingNode;
        }

        let parent;
        if (article.resolution) {
            parent = addResolution(article.resolution);
        } else if (article.annex) {
            parent = addAnnex(article.annex.annex);
        } else if (article.chapter) {
            parent = addChapter(article.chapter);
        } else if (article.addedByChange || article.newContentFrom) {
            parent = undefined; // To be set later when processing the change
        } else {
            // TODO CASE WHEN PARENT IS CHANGE
            console.warn(`Article ${article.id} has no parent`);
            return undefined;
        }

        const articleNode = new ValidityGraphNode({
            parent: parent,
        });
        nodeMap.set(articleKey(article.id), articleNode);
        return articleNode;
    }

    function addAnnex(annex: AnnexForGraph): ValidityGraphNode | undefined {
        const existingNode = nodeMap.get(annexKey(annex.id));
        if (existingNode) {
            return existingNode;
        }

        let parent;
        if (annex.resolution) {
            parent = addResolution(annex.resolution);
        } else if (annex.newContentForChangeReplaceAnnex) {
            const target = annex.newContentForChangeReplaceAnnex.targetAnnex;
            parent = undefined // To be set later when processing the change
        } else {
            console.warn(`Annex ${annex.id} has no parent`);
            return undefined;
        }

        const annexNode = new ValidityGraphNode({
            parent: parent,
        });
        nodeMap.set(annexKey(annex.id), annexNode);
        return annexNode;
    }

    function addChapter(chapter: ChapterForGraph): ValidityGraphNode | undefined {
        const existingNode = nodeMap.get(chapterKey(chapter.id));
        if (existingNode) {
            return existingNode;
        }
        if (!chapter.annex) {
            console.warn(`Chapter ${chapter.id} has no parent annex`);
            return undefined;
        }
        const parent = addAnnex(chapter.annex.annex);
        if (!parent) {
            return undefined;
        }
        const chapterNode = new ValidityGraphNode({
            parent: parent,
        });

        nodeMap.set(chapterKey(chapter.id), chapterNode);
        return chapterNode;
    }

    function addResolution(resolution: { id: string }): ValidityGraphNode | undefined {
        const existingNode = nodeMap.get(resolutionKey(resolution.id));
        if (existingNode) {
            return existingNode;
        }
        const resolutionNode = new ValidityGraphNode({
            parent: null,
        });
        nodeMap.set(resolutionKey(resolution.id), resolutionNode);
        return resolutionNode;
    }

    function getReferencedNode(_ref: Pick<Reference, "targetType"> & Pick<Reference, "resolution" | "article" | "annex" | "chapter">): ValidityGraphNode | undefined {
        const ref = checkConcreteReference(_ref);
        let key: string;
        switch (ref.targetType) {
            case "ARTICLE": {
                const refArticle = ref.article;
                if (refArticle.articleId) {
                    key = articleKey(refArticle.articleId);
                } else {
                    key = virtualArticleKey(refArticle);
                }
            }
                break;
            case "RESOLUTION": {
                const refResolution = ref.resolution;
                if (!refResolution.resolutionId) {
                    console.warn("Reference target RESOLUTION has no referenceResolution.resolutionId");
                    return undefined;
                }
                key = resolutionKey(refResolution.resolutionId);
                break;
            }
            case "ANNEX": {
                const refAnnex = ref.annex;
                if (refAnnex.annexId) {
                    key = annexKey(refAnnex.annexId);
                } else {
                    key = virtualAnnexKey(refAnnex);

                }
                break;
            }
            case "CHAPTER": {
                const refChapter = ref.chapter;
                if (refChapter.chapterId) {
                    key = chapterKey(refChapter.chapterId);
                } else {
                    key = virtualChapterKey(refChapter);
                }
                break;
            }
            default: {
                const _exhaustiveCheck: never = ref;
                throw new Error(`Unhandled reference target type: ${ref}`);
            }
        }
        return nodeMap.get(key);
    }

    changes.forEach((change) => {
        addChange(change);
    })

    // changes.forEach(change => {
    //     if (change.type === "ADD_ANNEX") {
    //         const newAnnex = change.changeAddAnnex.newAnnex;
    //         if (!newAnnex) {
    //             return;
    //         }
    //         const newAnnexNode = nodeMap.get(annexKey(newAnnex.id));
    //         if (!newAnnexNode) {
    //             return;
    //         }
    //         // TODO set parent
    //     }
    // });
    //
    // changes.forEach(change => {
    //     if (change.type === "ADD_ARTICLE") {
    //         const newArticle = change.changeAddArticle.newArticle;
    //         if (!newArticle) {
    //             return;
    //         }
    //         const newArticleNode = nodeMap.get(articleKey(newArticle.id));
    //         if (!newArticleNode) {
    //             return;
    //         }
    //     }
    // });
    //
    //
    // changes.forEach(change => {
    //     if (change.type === "REPLACE_ARTICLE") {
    //         const newArticle = change.changeReplaceArticle.newContent;
    //         if (!newArticle) {
    //             return;
    //         }
    //         const newArticleNode = nodeMap.get(articleKey(newArticle.id));
    //         if (!newArticleNode) {
    //             return;
    //         }
    //         const target = getReferencedNode({
    //             targetType: "ARTICLE",
    //             article: change.changeReplaceArticle.targetArticle,
    //             resolution: null,
    //             annex: null,
    //             chapter: null
    //         });
    //         if (!target) {
    //             console.warn("Could not find target article for REPLACE_ARTICLE change " + change.id);
    //             return;
    //         }
    //         target.setParent(newArticleNode.parent);
    //     }
    // });
    //

    // TODO add virtuals

    // After all objects are added, link approvers and repealers
    changes.forEach((change) => {
        const changeNode = nodeMap.get(changeKey(change.id));
        if (!changeNode) {
            console.warn("Could not find node for change " + change.id);
            return;
        }
        if (change.type === "REPEAL") {
            const changeRepeal = change.changeRepeal;
            const target = changeRepeal.target;

            const targetNode = getReferencedNode(target);
            if (!targetNode) {
                console.warn(`Could not find target node for REPEAL change ${change.id}`);
                return;
            }
            targetNode.addRepealer(changeNode);
        } else if (change.type === "REPLACE_ARTICLE") {
            const changeReplaceArticle = change.changeReplaceArticle;
            const replacedRef = changeReplaceArticle.targetArticle;
            const replacedNode = getReferencedNode({
                targetType: "ARTICLE",
                article: replacedRef,
                resolution: null,
                annex: null,
                chapter: null
            });
            if (!replacedNode) {
                console.warn(`Could not find target node for REPLACE_ARTICLE change ${change.id}`);
                return;
            } else {
                replacedNode.addRepealer(changeNode);
            }

            const newArticle = changeReplaceArticle.newContent!; //TODO REMOVE "!"
            const newArticleNode = nodeMap.get(articleKey(newArticle.id));
            if (!newArticleNode) {
                console.warn(`Could not find new article node for REPLACE_ARTICLE change ${change.id}`);
                return;
            } else {
                newArticleNode.addApprover(changeNode);
            }
        } else if (change.type === "REPLACE_ANNEX") {
            const changeReplaceAnnex = change.changeReplaceAnnex;
            const replacedRef = changeReplaceAnnex.targetAnnex;
            const replacedNode = getReferencedNode({
                targetType: "ANNEX",
                annex: replacedRef,
                resolution: null,
                article: null,
                chapter: null
            });
            if (!replacedNode) {
                console.warn(`Could not find target node for REPLACE_ANNEX change ${change.id}`);
            } else {
                replacedNode.addRepealer(changeNode);
            }

            let newAnnexNode: ValidityGraphNode | undefined;
            if (changeReplaceAnnex.newContentType === "REFERENCE") {
                const newAnnexRef = changeReplaceAnnex.newAnnexReference;
                newAnnexNode = getReferencedNode({
                    targetType: "ANNEX",
                    annex: newAnnexRef,
                    resolution: null,
                    article: null,
                    chapter: null
                });
            } else if (changeReplaceAnnex.newContentType === "INLINE") {
                const newInlineAnnex = changeReplaceAnnex.newInlineAnnex;
                if (!newInlineAnnex) {
                    console.warn("REPLACE_ANNEX change with INLINE new content has no newInlineAnnex data");
                    return;
                }
                newAnnexNode = nodeMap.get(annexKey(newInlineAnnex.id));
            }
            if (!newAnnexNode) {
                console.warn(`Could not find new annex node for REPLACE_ANNEX change ${change.id}`);
            } else {
                newAnnexNode.addApprover(changeNode);
            }
        } else if (change.type === "APPLY_MODIFICATIONS_ANNEX") {
            const changeApplyModificationsAnnex = change.changeApplyModificationsAnnex;
            const targetRef = changeApplyModificationsAnnex.annexToApply;
            const targetNode = getReferencedNode({
                targetType: "ANNEX",
                annex: targetRef,
                resolution: null,
                article: null,
                chapter: null
            });
            if (!targetNode) {
                console.warn(`Could not find target node for APPLY_MODIFICATIONS_ANNEX change ${change.id}`);
                return;
            }
            targetNode.addApprover(changeNode);
        } else if (change.type === "ADD_ANNEX") {
            const changeAddAnnex = change.changeAddAnnex;
            const newAnnexRef = changeAddAnnex.annexToAdd;
            const newAnnexNode = getReferencedNode({
                targetType: "ANNEX",
                annex: newAnnexRef,
                resolution: null,
                article: null,
                chapter: null
            });
            if (!newAnnexNode) {
                console.warn(`Could not find new annex node for ADD_ANNEX change ${change.id}`);
                return;
            }
            newAnnexNode.addApprover(changeNode);

        } else if (change.type === "ADD_ARTICLE") {
            const changeAddArticle = change.changeAddArticle;
            const newArticle = changeAddArticle.newArticle!;
            const newArticleNode = nodeMap.get(articleKey(newArticle.id));
            if (!newArticleNode) {
                console.warn(`Could not find new article node for ADD_ARTICLE change ${change.id}`);
                return;
            }
            newArticleNode.addApprover(changeNode);
        }
    });

    return changes.filter(change => {
        const changeNode = nodeMap.get(changeKey(change.id));
        if (!changeNode) {
            return false;
        }
        return changeNode.isValid();
    })
// TODO APPROVERS FOR ANNEXES???
// TODO ADD UUID TO ALL WARNS
}


class ValidityGraphNode {
    private _parent: ValidityGraphNode | null | undefined;
    private readonly approvers: ValidityGraphNode[] = [];
    private readonly repealers: ValidityGraphNode[] = [];
    private valid_value: boolean | undefined = undefined;

    constructor({parent}: {
        parent: ValidityGraphNode | null | undefined,

    }) {
        this._parent = parent;
    }

    isValid(): boolean {
        if (this.valid_value === undefined)
            this.valid_value = this.calculateIsValid();

        return this.valid_value;
    }

    private calculateIsValid() {
        if (this._parent === undefined) {
            console.warn("Node has undefined parent");
            return false;
        }
        if (this._parent !== null && !this._parent.isValid()) {
            return false;
        }

        if (this.repealers.find(r => r.isValid())) {
            return false;
        }

        if (this.approvers.find(a => a.isValid())) {
            return true;
        }
        return this.approvers.length === 0;
    }

    addApprover(approver: ValidityGraphNode) {
        this.approvers.push(approver);
    }

    addRepealer(repealer: ValidityGraphNode) {
        this.repealers.push(repealer);
    }

    setParent(parent: ValidityGraphNode | null) {
        if (this._parent !== undefined) {
            throw new Error("Parent is already set");
        }
        this._parent = parent;
    }

    get parent() {
        return this._parent;
    }
}


type PolymorphicChangeKeys =
    | 'changeReplaceArticle'
    | 'changeReplaceAnnex'
    | 'changeAddAnnex'
    | 'changeAddArticle'
    | 'changeRepeal'
    | 'changeAdvanced'
    | 'changeModifyTextAnnex'
    | 'changeRatifyAdReferendum'
    | 'changeApplyModificationsAnnex'
    | 'changeModifyArticle'

type ChangeTypeConfig = {
    [K in ChangeType]: PolymorphicChangeKeys;
};

const ChangeConfigMap = {
    REPLACE_ARTICLE: 'changeReplaceArticle',
    REPLACE_ANNEX: 'changeReplaceAnnex',
    ADD_ANNEX: 'changeAddAnnex',
    ADD_ARTICLE: 'changeAddArticle',
    REPEAL: 'changeRepeal',
    ADVANCED: 'changeAdvanced',
    APPLY_MODIFICATIONS_ANNEX: "changeApplyModificationsAnnex",
    MODIFY_ARTICLE: "changeModifyArticle",
    MODIFY_TEXT_ANNEX: "changeModifyTextAnnex",
    RATIFY_AD_REFERENDUM: "changeRatifyAdReferendum"
} as const satisfies Record<ChangeType, PolymorphicChangeKeys>;

type CheckConcreteChangeConstraint = Record<PolymorphicChangeKeys, object | null> & {
    type: ChangeType
}

type ValidChange = {
    [T in keyof ChangeTypeConfig]:
    { type: T }
    &
    { [K in ChangeTypeConfig[T]]: object }
    &
    { [K in Exclude<PolymorphicChangeKeys, ChangeTypeConfig[T]>]: null }
}[keyof ChangeTypeConfig];


function checkConcreteChange<C extends CheckConcreteChangeConstraint>(change: C): C & ValidChange {
    if (change[ChangeConfigMap[change.type]] === null) {
        throw new Error(`Change of type ${change.type} must have ${ChangeConfigMap[change.type]} defined.`);
    } else if (Object.values(ChangeConfigMap).filter(key => key !== ChangeConfigMap[change.type]).some(key => change[key as PolymorphicChangeKeys] !== null)) {
        throw new Error("Change has extraneous polymorphic fields defined.");
    }
    return change as ValidChange;
}


type PolymorphicReferenceKeys = "article" | "chapter" | "resolution" | "annex";

type ReferenceTypeConfig = {
    [K in ReferenceTargetType]: PolymorphicReferenceKeys;
};

const ReferenceConfigMap = {
    RESOLUTION: "resolution",
    ARTICLE: "article",
    ANNEX: "annex",
    CHAPTER: "chapter"
} as const satisfies ReferenceTypeConfig

type CheckConcreteReferenceConstraint = Record<PolymorphicReferenceKeys, object | null> & {
    targetType: ReferenceTargetType
}

type ValidReference = {
    [T in keyof ReferenceTypeConfig]:
    { targetType: T }
    &
    { [K in ReferenceTypeConfig[T]]: object }
    &
    { [K in Exclude<PolymorphicReferenceKeys, ReferenceTypeConfig[T]>]: null }
}[keyof ReferenceTypeConfig];


function checkConcreteReference<R extends CheckConcreteReferenceConstraint>(reference: R): R & ValidReference {
    if (reference[ReferenceConfigMap[reference.targetType]] === null) {
        throw new Error(`Change of type ${reference.targetType} must have ${ReferenceConfigMap[reference.targetType]} defined.`);
    } else if (Object.values(ReferenceConfigMap).filter(key => key !== ReferenceConfigMap[reference.targetType]).some(key => reference[key as PolymorphicReferenceKeys] !== null)) {
        throw new Error("Change has extraneous polymorphic fields defined.");
    }
    return reference as ValidReference;
}