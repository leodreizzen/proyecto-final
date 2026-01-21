import {GraphNode} from "@/lib/assembly/validity/domain/graph-node";
import {VersionResolver} from "@/lib/assembly/validity/domain/version-resolver";
import {NodeCoordinates} from "@/lib/assembly/validity/types/coordinates";

export class Graph {
    private readonly nodes: Map<string, GraphNode> = new Map();
    private readonly resolver: VersionResolver = new VersionResolver();

    constructor() {
    }

    clear() {
        this.nodes.clear();
        this.resolver.clear();
    }

    acquireNode(id: string): GraphNode {
        if (!this.nodes.has(id)) {
            this.nodes.set(id, new GraphNode(id));
        }
        return this.nodes.get(id)!;
    }

    registerVersion(coords: NodeCoordinates, node: GraphNode) {
        this.resolver.registerVersion(coords, node);
    }

    registerBaseVersion(coords: NodeCoordinates, node: GraphNode) {
        this.resolver.registerFirstVersion(coords, node);
    }

    getActiveVersion(coords: NodeCoordinates): GraphNode | null {
        return this.resolver.getCurrentActiveVersion(coords);
    }

    hasVersion(coords: NodeCoordinates): boolean {
        return this.resolver.hasDefinedVersion(coords);
    }

    resolveCurrentNode(coords: NodeCoordinates): GraphNode | null {
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

