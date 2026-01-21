import {GraphNode} from "@/lib/assembly/validity/domain/graph-node";
import {
    NodeCoordinates,
} from "@/lib/assembly/validity/types/coordinates";
import {
    annexReferenceToCoordinates, annexRefToPayload, articleReferenceToCoordinates, articleRefToPayload,
    chapterReferenceToCoordinates, extractParentCoords,
    genericReferenceToCoordinates, genericRefToPayload, resolutionReferenceToCoordinates
} from "./utils/references";
import {
    ChangeForGraph,
    ObjectForGraph,
} from "@/lib/assembly/validity/types/definitions";
import {Graph} from "@/lib/assembly/validity/domain/graph";
import {NativeHydrator} from "@/lib/assembly/validity/strategies/native-hydrator";
import {ResultBuilder} from "@/lib/assembly/validity/strategies/result-builder";

type TargetDescriptor = {
    coords: NodeCoordinates;
    nativePayload: ObjectForGraph | null;
}

class ChangeValidityService {
    private validityGraph: Graph = new Graph();
    private readonly hydrator = new NativeHydrator(this.validityGraph);
    private readonly resultBuilder = new ResultBuilder(this.validityGraph);
    constructor() {
    }

    loadChanges(changes: ChangeForGraph[]) {
        this.validityGraph.clear();

        const sortedChanges = this.sortChangesByDate(changes);

        this.processChanges(sortedChanges);
    }

    getValidChanges(): string[] {
        return this.validityGraph.getValidNodeIds();
    }


    private processChanges(changes: ChangeForGraph[]) {
        for (const change of changes) {
            const changeNode = this.validityGraph.acquireNode(change.id);
            const victimDescriptor = this.getVictimDescriptor(change);

            this.hydrateChange(change, changeNode)
            if (victimDescriptor){
                this.processVictims(change, changeNode, victimDescriptor);
            }

            this.buildResults(change, victimDescriptor);
        }
    }


    private sortChangesByDate(changes: ChangeForGraph[]): ChangeForGraph[] {
        return changes.toSorted((a, b) => {
            const dateCompare = a.date.getTime() - b.date.getTime();
            if (dateCompare !== 0) {
                return dateCompare;
            }
            return a.id.localeCompare(b.id);
        });
    }

    private hydrateChange(change: ChangeForGraph, changeNode: GraphNode): void {
        if (change.articleModifier.article) {
            const contextResult = this.hydrator.hydrate({
                type: 'article',
                object: change.articleModifier.article
            });
            changeNode.addDependency(contextResult.node);
        }
    }

    private processVictims(change: ChangeForGraph, changeNode: GraphNode, victimDescriptor: TargetDescriptor): void {
            if (victimDescriptor.nativePayload && !this.validityGraph.getActiveVersion(victimDescriptor.coords)) {
                this.hydrator.hydrate(victimDescriptor.nativePayload);
            }
            const victimNode = this.validityGraph.resolveCurrentNode(victimDescriptor.coords);
            if (victimNode) {
                changeNode.addRepealer(victimNode);
            }
    }


    private buildResults(change: ChangeForGraph, victimDescriptor: TargetDescriptor | null): void {
        const contextCoords = this.getContextCoordsForBuild(change, victimDescriptor);
        let structuralParent: GraphNode | null = null;

        if (contextCoords) {
            const parentCoordsToResolve = change.type === "REPLACE_ARTICLE" || change.type === "REPLACE_ANNEX" ?
                extractParentCoords(contextCoords)
                : contextCoords;

            if (parentCoordsToResolve) {
                structuralParent = this.validityGraph.resolveCurrentNode(parentCoordsToResolve);
            }
        }

        this.resultBuilder.build(change, structuralParent, contextCoords);
    }

    private getVictimDescriptor(change: ChangeForGraph): TargetDescriptor | null {
        switch (change.type) {
            case "REPEAL": {
                const ref = change.changeRepeal.target;
                return {
                    coords: genericReferenceToCoordinates(ref),
                    nativePayload: genericRefToPayload(ref)
                };
            }
            case "REPLACE_ARTICLE": {
                const ref = change.changeReplaceArticle.targetArticle;
                return {
                    coords: articleReferenceToCoordinates(ref),
                    nativePayload: articleRefToPayload(ref)
                };
            }
            case "REPLACE_ANNEX": {
                const ref = change.changeReplaceAnnex.targetAnnex;
                return {
                    coords: annexReferenceToCoordinates(ref),
                    nativePayload: annexRefToPayload(ref)
                };
            }
            default:
                return null;
        }
    }


    private getContextCoordsForBuild(change: ChangeForGraph, victimDesc: TargetDescriptor | null): NodeCoordinates | null {
        if (victimDesc) return victimDesc.coords;

        if (change.type === "ADD_ARTICLE") {
            const add = change.changeAddArticle;
            if (add.targetResolution) return resolutionReferenceToCoordinates(add.targetResolution);
            if (add.targetAnnex) return annexReferenceToCoordinates(add.targetAnnex);
            if (add.targetChapter) return chapterReferenceToCoordinates(add.targetChapter);
        }

        if (change.type === "ADD_ANNEX") {
            if (change.changeAddAnnex.targetResolution) {
                return resolutionReferenceToCoordinates(change.changeAddAnnex.targetResolution);
            }
            throw new Error("ADD_ANNEX without targetResolution is not implemented yet");
            // TODO subanexes
        }
        // TODO APPLY_MODIFICATIONS_ANNEX
        return null;
    }
}