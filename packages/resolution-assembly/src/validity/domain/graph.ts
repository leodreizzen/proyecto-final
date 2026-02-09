import {ValidityGraphNode} from "../domain/graph-node";
import {VersionResolver} from "../domain/version-resolver";
import {NodeCoordinates} from "../types/coordinates";

export class ValidityGraph {
    private readonly nodes: Map<string, ValidityGraphNode> = new Map();
    private readonly resolver: VersionResolver = new VersionResolver();

    constructor() {
    }

    clear() {
        this.nodes.clear();
        this.resolver.clear();
    }

    acquireNode(id: string): ValidityGraphNode {
        if (!this.nodes.has(id)) {
            this.nodes.set(id, new ValidityGraphNode(id));
        }
        return this.nodes.get(id)!;
    }

    registerVersion(coords: NodeCoordinates, node: ValidityGraphNode) {
        this.resolver.registerVersion(coords, node);
    }

    registerBaseVersion(coords: NodeCoordinates, node: ValidityGraphNode) {
        this.resolver.registerFirstVersion(coords, node);
    }

    getActiveVersion(coords: NodeCoordinates): ValidityGraphNode | null {
        return this.resolver.getCurrentActiveVersion(coords);
    }

    hasVersion(coords: NodeCoordinates): boolean {
        return this.resolver.hasDefinedVersion(coords);
    }

    isNodeValid(id: string): boolean {
        const node = this.nodes.get(id);
        return node ? node.isValid() : false;
    }

    resolveCurrentNode(coords: NodeCoordinates): ValidityGraphNode | null {
        const active = this.resolver.getCurrentActiveVersion(coords);
        if (active) return active;

        return this.resolver.getLatestRegistered(coords);
    }

    getValidNodeIds(): string[] {
        const validChanges: string[] = [];
        this.nodes.forEach((node) => {
            if (node.isValid()) {
                validChanges.push(node.id);
            }
        });
        return validChanges;
    }

    getNodeRepealer(nodeId: string): ValidityGraphNode | null {
        const node = this.nodes.get(nodeId);
        if (!node) return null;

        if (node.isValid())
            return null;

        return node.getIndirectRepealer();
    }
}

