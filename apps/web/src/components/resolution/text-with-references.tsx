import {ReferenceMarker} from "@/lib/definitions/references";
import {pathForResolution} from "@/lib/paths";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {AlertCircle} from "lucide-react";
import {formatResolutionId} from "@/lib/utils";

interface TextWithReferencesProps {
    text: string;
    markers: ReferenceMarker[];
    className?: string;
}

export function TextWithReferences({text, markers, className}: TextWithReferencesProps) {
    if (!markers || markers.length === 0) {
        return <span className={className}>{text}</span>;
    }

    const segments = [];
    let lastIndex = 0;

    markers.forEach((marker, idx) => {
        // Text before the marker
        if (marker.start > lastIndex) {
            segments.push(
                <span key={`text-${idx}`}>
                    {text.substring(lastIndex, marker.start)}
                </span>
            );
        }

        const content = text.substring(marker.start, marker.end);

        if (marker.data.valid) {
            const href = pathForResolution(marker.data.target);

            segments.push(
                <a
                    key={`marker-${idx}`} 
                    href={href}
                    className="text-blue-600 dark:text-blue-400 hover:underline decoration-blue-600/30"
                >
                    {content}
                </a>
            );
        } else {
            segments.push(
                <Popover key={`marker-${idx}`}>
                    <PopoverTrigger asChild>
                        <span className="text-red-600 dark:text-red-400 cursor-help decoration-dotted underline decoration-red-600/50 hover:bg-red-50 dark:hover:bg-red-900/20 rounded px-0.5 -mx-0.5 transition-colors">
                            {content}
                        </span>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 font-semibold text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                <span>Referencia no encontrada</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                El documento referenciado ({formatResolutionId(marker.data.target)}) no se encuentra cargado en el sistema.
                            </p>
                        </div>
                    </PopoverContent>
                </Popover>
            );
        }

        lastIndex = marker.end;
    });

    // Remaining text
    if (lastIndex < text.length) {
        segments.push(
            <span key="text-end">
                {text.substring(lastIndex)}
            </span>
        );
    }

    return <span className={className}>{segments}</span>;
}
