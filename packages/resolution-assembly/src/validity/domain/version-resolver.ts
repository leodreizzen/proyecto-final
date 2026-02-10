import { ValidityGraphNode } from "../domain/graph-node";
import { NodeCoordinates } from "../types/coordinates";
import { stableStringify } from "../../utils/serialization";

export class VersionResolver {
    private versionHistory = new Map<string, ValidityGraphNode[]>();
    private secondaryLookup = new Map<string, string>(); // Maps "Article X in Annex (parent)" key -> "Article X in Chapter (real)" key

    registerVersion(coordinates: NodeCoordinates, node: ValidityGraphNode): void {
        const key = stableStringify(coordinates);
        if (!this.versionHistory.has(key)) {
            this.versionHistory.set(key, []);
        }
        this.versionHistory.get(key)!.push(node);

        // Register secondary lookup if applicable
        if (coordinates.type === "article" && coordinates.coords.parent.type === "chapter") {
            const originalParent = coordinates.coords.parent.coords;
            const annexParent = originalParent.parent;

            const alternativeCoords: NodeCoordinates = {
                type: "article",
                coords: {
                    parent: {
                        type: "annex",
                        coords: annexParent
                    },
                    articleNumber: coordinates.coords.articleNumber,
                    articleSuffix: coordinates.coords.articleSuffix
                }
            };

            const alternativeKey = stableStringify(alternativeCoords);
            this.secondaryLookup.set(alternativeKey, key);
        }
    }

    getCurrentActiveVersion(coordinates: NodeCoordinates): ValidityGraphNode | null {
        const key = stableStringify(coordinates);
        let stack = this.versionHistory.get(key);

        if (!stack && this.secondaryLookup.has(key)) {
            const redirectKey = this.secondaryLookup.get(key)!;
            stack = this.versionHistory.get(redirectKey);
        }

        if (!stack || stack.length === 0) return null;

        const lastValid = stack.findLast(node => node.isValid());

        return lastValid ?? null;
    }

    getLatestRegistered(coordinates: NodeCoordinates): ValidityGraphNode | null {
        const key = stableStringify(coordinates);
        let stack = this.versionHistory.get(key);

        if (!stack && this.secondaryLookup.has(key)) {
            const redirectKey = this.secondaryLookup.get(key)!;
            stack = this.versionHistory.get(redirectKey);
        }

        if (!stack || stack.length === 0) return null;
        return stack[stack.length - 1]!;
    }

    hasDefinedVersion(coordinates: NodeCoordinates): boolean {
        const key = stableStringify(coordinates);
        let stack = this.versionHistory.get(key);

        if (!stack && this.secondaryLookup.has(key)) {
            const redirectKey = this.secondaryLookup.get(key)!;
            stack = this.versionHistory.get(redirectKey);
        }

        return !!stack && stack.length > 0;
    }

    clear(): void {
        this.versionHistory.clear();
        this.secondaryLookup.clear();
    }

    registerFirstVersion(coordinates: NodeCoordinates, node: ValidityGraphNode): void {
        // Just delegate to registerVersion logic for map population but ensure order
        const key = stableStringify(coordinates);
        const stack = this.versionHistory.get(key);

        if (!stack || stack.length === 0) {
            this.registerVersion(coordinates, node);
        } else if (!stack.find(v => v === node)) {
            stack.unshift(node);

            // Should valid logic also register secondary lookup here? Yes.
            if (coordinates.type === "article" && coordinates.coords.parent.type === "chapter") {
                // Logic duplicated from registerVersion to ensure consistency
                const originalParent = coordinates.coords.parent.coords; // Chapter coords
                const annexParent = originalParent.parent; // Annex coords

                const alternativeCoords: NodeCoordinates = {
                    type: "article",
                    coords: {
                        parent: {
                            type: "annex",
                            coords: annexParent
                        },
                        articleNumber: coordinates.coords.articleNumber,
                        articleSuffix: coordinates.coords.articleSuffix
                    }
                };

                const alternativeKey = stableStringify(alternativeCoords);
                this.secondaryLookup.set(alternativeKey, key);
            }
        }
    }
}