type Subreporter = {
    weight: number;
    progress: number;
    reporter: ProgressReporter;
}

type DetailedProgress = {
    name: string;
    totalProgress: number;
    children: DetailedProgress[];
}

export default class ProgressReporter {
    name: string;
    private progress: number;
    private readonly onReport: ((progress: number, reporter: ProgressReporter) => void);
    private children: Subreporter[] = [];

    constructor({name, onReport}: {name: string, onReport: (progress: number, reporter: ProgressReporter) => void }) {
        this.onReport = onReport;
        this.name = name;
        this.progress = 0;
    }

    addSubreporter(name: string, weight: number) {
        if(this.progress > 0)
            throw new Error("Cannot add subreporter after progress has been reported");

        if(weight <= 0) {
            throw new Error("Subreporter weight must be greater than zero");
        }

        const subReporter = {
            weight,
            progress: 0,
            reporter: new ProgressReporter({
                name,
                onReport: (progress: number) => {
                    this.reportFromChild(subReporter, progress);
                }
            })
        }
        this.children.push(subReporter);
        return subReporter.reporter;
    }

    reportProgress(progress: number) {
        if (this.children.length > 0) {
            throw new Error("Cannot directly report progress when there are child reporters");
        }
        if (progress < 0 || progress > 1) {
            throw new Error("Progress must be between 0 and 1");
        }
        this.progress = progress;
        this.onReport(progress, this);
    }

    getDetailedProgress(): DetailedProgress {
        return {
            name: this.name,
            totalProgress: this.calculateProgress(),
            children: this.children.map(child => child.reporter.getDetailedProgress())
        }
    }

    private reportFromChild(subreporter: Subreporter, progress: number) {
        subreporter.progress = progress;
        this.onReport(this.calculateProgress(), this);
    }

    private calculateProgress() {
        if( this.children.length === 0) {
            return this.progress;
        }

        const totalWeight = this.children.reduce((total, s) => total + s.weight, 0);
        let weightedProgress = 0
        this.children.forEach(sub => {
            weightedProgress += (sub.progress * sub.weight) / totalWeight;
        });
        return weightedProgress;
    }
}