import {ValidityGraphNode} from "../domain/graph-node";
import {NodeCoordinates} from "../types/coordinates";
import {ValidityGraph} from "../domain/graph";
import {ChangeForGraph, NewAnnex} from "../types/definitions";
import {
    calculateChildAnnexCoords,
    calculateChildArticleCoords,
    calculateChildChapterCoords
} from "../utils/coordinates";
import {enforceArticleNumber} from "../utils/numbers";

export class ResultBuilder {

    constructor(private graph: ValidityGraph) {
    }

    build(
        change: ChangeForGraph,
        structuralParent: ValidityGraphNode | null,
        contextCoords: NodeCoordinates | null
    ) {
        const changeNode = this.graph.acquireNode(change.id);

        switch (change.type) {
            case "ADD_ARTICLE":
                this.buildAddArticle(change, changeNode, structuralParent, contextCoords);
                break;
            case "REPLACE_ARTICLE":
                this.buildReplaceArticle(change, changeNode, structuralParent, contextCoords);
                break;
            case "ADD_ANNEX":
                this.buildAddAnnex(change, changeNode, structuralParent, contextCoords);
                break;
            case "REPLACE_ANNEX":
                this.buildReplaceAnnex(change, changeNode, structuralParent, contextCoords);
                break;
            case "APPLY_MODIFICATIONS_ANNEX":
                this.buildApplyModificationsAnnex(change, changeNode);
                break;
        }
    }

    private buildAndRegisterNode(
        id: string,
        coords: NodeCoordinates | null,
        changeNode: ValidityGraphNode,
        structuralParent: ValidityGraphNode | null
    ): ValidityGraphNode {
        const node = this.graph.acquireNode(id);

        node.addDependency(changeNode);

        if (structuralParent) {
            node.addDependency(structuralParent);
        }

        if (coords) {
            this.graph.registerVersion(coords, node);
        }

        return node;
    }

    private buildAddArticle(
        change: ChangeForGraph & { type: "ADD_ARTICLE" },
        changeNode: ValidityGraphNode,
        structuralParent: ValidityGraphNode | null,
        parentCoords: NodeCoordinates | null
    ) {
        const {newArticle, newArticleNumber, newArticleSuffix} = change.changeAddArticle;

        if (!newArticle) throw new Error("ADD_ARTICLE without newArticle data");
        if (!parentCoords) throw new Error("ADD_ARTICLE requires parent coordinates");


        const newCoords = newArticleNumber !== null ? {
            type: "article",
            coords: calculateChildArticleCoords(
                parentCoords,
                newArticleNumber,
                newArticleSuffix
            )
        } as const : null; // Don't register version if no number is provided

        this.buildAndRegisterNode(newArticle.id, newCoords, changeNode, structuralParent);
    }

    private buildReplaceArticle(
        change: ChangeForGraph & { type: "REPLACE_ARTICLE" },
        changeNode: ValidityGraphNode,
        structuralParent: ValidityGraphNode | null,
        victimCoords: NodeCoordinates | null
    ) {
        const {newContent} = change.changeReplaceArticle;

        if (!newContent) throw new Error("REPLACE_ARTICLE without newContent data");
        if (!victimCoords) return;

        this.buildAndRegisterNode(newContent.id, victimCoords, changeNode, structuralParent);
    }

    private buildAddAnnex(
        change: ChangeForGraph & { type: "ADD_ANNEX" },
        changeNode: ValidityGraphNode,
        structuralParent: ValidityGraphNode | null,
        parentCoords: NodeCoordinates | null
    ) {
        const add = change.changeAddAnnex;
        const newAnnexData = add.annexToAdd?.annex;

        if (!newAnnexData) return;
        if (!parentCoords) throw new Error("ADD_ANNEX requires parent coordinates");
        if (!structuralParent) return;

        let newCoords;
        if (add.newAnnexNumber !== null) {
            const newAnnexCoordsObj = calculateChildAnnexCoords(parentCoords, add.newAnnexNumber);
            newCoords = {type: 'annex', coords: newAnnexCoordsObj} as const;
        } else {
            newCoords = null; // Don't register version if no number is provided
        }

        this.buildAnnexHierarchy(newAnnexData, newCoords, changeNode, structuralParent);
    }

    private buildReplaceAnnex(
        change: ChangeForGraph & { type: "REPLACE_ANNEX" },
        changeNode: ValidityGraphNode,
        structuralParent: ValidityGraphNode | null,
        victimCoords: NodeCoordinates | null
    ) {
        const replace = change.changeReplaceAnnex;
        const newAnnexData = replace.newContentType === "INLINE"
            ? replace.newInlineAnnex
            : replace.newAnnexReference?.annex;

        if (!newAnnexData) return;
        if (!victimCoords || victimCoords.type !== 'annex') return;

        this.buildAnnexHierarchy(newAnnexData, victimCoords as NodeCoordinates & {
            type: 'annex'
        }, changeNode, structuralParent);
    }


    private buildAnnexHierarchy(
        annexData: NewAnnex,
        coords: (NodeCoordinates & { type: 'annex' }) | null,
        changeNode: ValidityGraphNode,
        structuralParent: ValidityGraphNode | null
    ) {
        const annexNode = this.buildAndRegisterNode(annexData.id, coords, changeNode, structuralParent);

        if (annexData.type === "WITH_ARTICLES" && annexData.annexWithArticles) {
            const content = annexData.annexWithArticles;

            for (const article of content.standaloneArticles) {
                let newCoords;
                if (!coords) {
                    newCoords = null;
                } else {
                    const artCoords = calculateChildArticleCoords(
                        coords,
                        enforceArticleNumber(article.number),
                        article.suffix
                    );
                    newCoords = {
                        type: 'article',
                        coords: artCoords
                    } as const
                }

                this.buildAndRegisterNode(article.id, newCoords, changeNode, annexNode);
            }

            for (const chapter of content.chapters) {
                let chapCoords;
                if(!coords) {
                    chapCoords = null;
                } else {
                    const chapCoordsObj = calculateChildChapterCoords(coords, chapter.number);
                    chapCoords = {type: 'chapter', coords: chapCoordsObj} as const;
                }

                const chapterNode = this.buildAndRegisterNode(chapter.id, chapCoords, changeNode, annexNode);

                for (const article of chapter.articles) {
                    let newCoords;
                    if (!chapCoords) {
                       newCoords = null;
                    } else {
                        const artCoords = calculateChildArticleCoords(
                            chapCoords,
                            enforceArticleNumber(article.number),
                            article.suffix
                        );
                        newCoords = {type: 'article', coords: artCoords} as const;
                    }

                    this.buildAndRegisterNode(article.id, newCoords, changeNode, chapterNode);
                }
            }
        }
    }

    private buildApplyModificationsAnnex(
        change: ChangeForGraph & { type: "APPLY_MODIFICATIONS_ANNEX" },
        changeNode: ValidityGraphNode
    ) {
        const ref = change.changeApplyModificationsAnnex.annexToApply;

        if (!ref.annexId) return; // We assume the referenced annex is always native

        const annexNode = this.graph.acquireNode(ref.annexId);

        annexNode.addDependency(changeNode); // The annex is subordinate to the change
    }
}