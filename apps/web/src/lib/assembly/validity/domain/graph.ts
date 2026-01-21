import {ValidityGraphNode} from "@/lib/assembly/validity/domain/graph-node";
import {VersionResolver} from "@/lib/assembly/validity/domain/version-resolver";
import {NodeCoordinates} from "@/lib/assembly/validity/types/coordinates";

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
}

