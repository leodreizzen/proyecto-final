import { formatResolutionId, formatTimeAgo } from "@/lib/utils";
import Link from "next/link";
import { ScrollShadow } from "@heroui/react";
import { pathForResolution } from "@/lib/paths";
import {fetchLastResolutions} from "@/lib/data/resolutions";

export async function LatestResolutions() {
    const resolutions = await fetchLastResolutions(6);
    if (resolutions.length === 0) return null;

    return (
        <section id="latest-resolutions" className="space-y-6 scroll-mt-24">
            <h2 className="text-xl font-bold font-serif px-1">Últimas Resoluciones</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resolutions.map((res, i) => {
                    const id = { initial: res.initial, number: res.number, year: res.year };
                    return (
                        <div 
                            key={i} 
                            className="group flex flex-col bg-card border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                        >
                            <div className="px-4 py-3 border-b bg-muted/20">
                                <div className="flex justify-between items-start mb-0.5">
                                    <span className="text-[10px] text-muted-foreground">
                                        {formatTimeAgo(res.date)}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold font-serif leading-tight">
                                    <Link 
                                        href={pathForResolution(id)}
                                        className="hover:text-primary transition-colors"
                                    >
                                        Res. {formatResolutionId(id)}
                                    </Link>
                                </h3>
                            </div>
                            <div className="p-4 flex-1">
                                <ScrollShadow className="h-20 text-xs text-muted-foreground leading-relaxed">
                                    {res.summary}
                                </ScrollShadow>
                            </div>
                            <div className="px-4 py-2 bg-muted/5 border-t">
                                <Link 
                                    href={pathForResolution(id)}
                                    className="text-[10px] font-medium text-primary hover:underline flex items-center"
                                >
                                    Ver resolución completa →
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
