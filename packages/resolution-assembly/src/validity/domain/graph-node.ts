export class ValidityGraphNode {
    readonly id: string;

    private readonly dependencies = new Set<ValidityGraphNode>();
    private readonly repealers = new Set<ValidityGraphNode>();

    private validValue: boolean | null = null;
    private invalidationSubscribers: (() => void)[] = [];

    private evaluating: boolean = false; // used for cycle detection

    constructor(id: string) {
        this.id = id;
    }

    isValid(): boolean {
        if (this.validValue === null) {
            this.validValue = this.calculateIsValid();
        }
        return this.validValue;
    }


    addRepealer(repealer: ValidityGraphNode) {
        if (repealer === this) return;

        if (!this.repealers.has(repealer)) {
            this.repealers.add(repealer);
            repealer.subscribeInvalidation(() => this.invalidateCache());
            this.invalidateCache();
        }
    }

    addDependency(dependency: ValidityGraphNode) {
        if (dependency === this) return;

        if (!this.dependencies.has(dependency)) {
            this.dependencies.add(dependency);
            dependency.subscribeInvalidation(() => this.invalidateCache());
            this.invalidateCache();
        }
    }

    subscribeInvalidation(callback: () => void) {
        this.invalidationSubscribers.push(callback);
    }

    private calculateIsValid(): boolean {
        if (this.evaluating) {
            console.warn(`Cycle detected involving node ${this.id}. Breaking loop assuming FALSE.`);
            return false;
        }

        this.evaluating = true;

        try {
            for (const dep of this.dependencies) {
                if (!dep.isValid()) return false;
            }

            for (const repealer of this.repealers) {
                if (repealer.isValid()) return false;
            }

            return true;

        } finally {
            this.evaluating = false;
        }
    }

    private invalidateCache() {
        if (this.invalidationSubscribers.length === 0) {
            this.validValue = null;
            return;
        }

        if (this.evaluating) return;

        const oldValid = this.validValue;
        this.validValue = null;

        const newValid = this.isValid();

        if (oldValid !== newValid) {
            [...this.invalidationSubscribers].forEach(cb => cb());
        }
    }
}
