import Link from "next/link";
import { ScrollShadow } from "@heroui/react";
import { formatResolutionId, formatTimeAgo, formatDateUTC } from "@/lib/utils";
import { pathForResolution } from "@/lib/paths";

interface ResolutionCardProps {
    resolution: {
        initial: string;
        number: number;
        year: number;
        title?: string | null;
        summary: string;
        date: Date;
    };
    showExactDate?: boolean;
}

export function ResolutionCard({ resolution, showExactDate = false }: ResolutionCardProps) {
    const id = { initial: resolution.initial, number: resolution.number, year: resolution.year };
    
    return (
        <div className="group flex flex-col bg-card border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden h-full">
            <div className="px-4 py-3 border-b bg-muted/20">
                <div className="flex justify-between items-start mb-0.5">
                    <span className="text-[10px] text-muted-foreground">
                        {showExactDate ? formatDateUTC(resolution.date) : formatTimeAgo(resolution.date)}
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
            
            <div className="p-4 flex-1 flex flex-col gap-2">
                {resolution.title && (
                    <h4 className="font-semibold text-sm leading-snug line-clamp-2">
                        {resolution.title}
                    </h4>
                )}
                
                <ScrollShadow className="h-28 text-xs text-muted-foreground leading-relaxed">
                    {resolution.summary}
                </ScrollShadow>
            </div>
            
            <div className="px-4 py-2 bg-muted/5 border-t mt-auto">
                <Link 
                    href={pathForResolution(id)}
                    className="text-[10px] font-medium text-primary hover:underline flex items-center"
                >
                    Ver resolución completa →
                </Link>
            </div>
        </div>
    );
}
