import {ValidityGraphNode} from "../domain/graph-node";
import {NodeCoordinates} from "../types/coordinates";
import {stableStringify} from "../../utils/serialization";

export class VersionResolver {
    private versionHistory = new Map<string, ValidityGraphNode[]>();

    registerVersion(coordinates: NodeCoordinates, node: ValidityGraphNode): void {
        const key = stableStringify(coordinates);
        if (!this.versionHistory.has(key)) {
            this.versionHistory.set(key, []);
        }
        this.versionHistory.get(key)!.push(node);
    }

    getCurrentActiveVersion(coordinates: NodeCoordinates): ValidityGraphNode | null {
        const key = stableStringify(coordinates);
        const stack = this.versionHistory.get(key);

        if (!stack || stack.length === 0) return null;

        const lastValid = stack.findLast(node => node.isValid());

        return lastValid ?? null;
    }

    getLatestRegistered(coordinates: NodeCoordinates): ValidityGraphNode | null {
        const key = stableStringify(coordinates);
        const stack = this.versionHistory.get(key);
        if (!stack || stack.length === 0) return null;
        return stack[stack.length - 1]!;
    }

    hasDefinedVersion(coordinates: NodeCoordinates): boolean {
        const key = stableStringify(coordinates);
        const stack = this.versionHistory.get(key);
        return !!stack && stack.length > 0;
    }

    clear(): void {
        this.versionHistory.clear();
    }

    registerFirstVersion(coordinates: NodeCoordinates, node: ValidityGraphNode): void {
        const key = stableStringify(coordinates);
        const stack = this.versionHistory.get(key);
        if (!stack || stack.length === 0) {
            this.registerVersion(coordinates, node);
        } else if (!stack.find(v => v === node)) {
            stack.unshift(node);
        }
    }
}