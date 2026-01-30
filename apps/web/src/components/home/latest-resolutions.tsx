import { ResolutionCard } from "@/components/resolution-card";
import {fetchLatestResolutions} from "@/lib/data/resolutions";

export async function LatestResolutions() {
    const resolutions = await fetchLatestResolutions(4);

    if (resolutions.length === 0) return null;

    return (
        <section id="latest-resolutions" className="space-y-6 scroll-mt-24">
            <h2 className="text-xl font-bold font-serif px-1">Últimas Resoluciones</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resolutions.map((res, i) => (
                    <ResolutionCard key={i} resolution={res} />
                ))}
            </div>
        </section>
    );
}
