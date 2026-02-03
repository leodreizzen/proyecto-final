"use client"; // needed for popover to work
import {InapplicableChange} from "@/lib/definitions/changes";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Button} from "@/components/ui/button";
import {AlertTriangle} from "lucide-react";
import {formatChangeSource, formatChangeType} from "@/lib/utils";
import Link from "next/link";
import {pathForResolution} from "@/lib/paths";
import {useMemo} from "react";
interface InapplicableChangesAlertProps {
    changes: InapplicableChange[];
}

export function InapplicableChangesAlert({changes}: InapplicableChangesAlertProps) {
    const errorItems = useMemo(() => {
        if (changes.length === 0) return [];
        // Deduplicate maintaining context
        const uniqueErrors = new Map<string, { source: string, type: string, context: InapplicableChange['context'] }>();

        changes.forEach(c => {
            const source = formatChangeSource(c.context);
            const type = formatChangeType(c.type);
            const key = `${source}-${type}`;

            if (!uniqueErrors.has(key)) {
                uniqueErrors.set(key, { source, type, context: c.context });
            }
        });

        return  Array.from(uniqueErrors.values());
    }, [changes]);
    if (changes.length === 0) return null;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-500 dark:hover:text-amber-400 dark:hover:bg-amber-900/20 h-auto py-1 px-2 gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                        No se {changes.length == 1 ? "pudo aplicar" : "pudieron aplicar"} {changes.length} {changes.length === 1 ? 'cambio' : 'cambios'}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 border-b border-amber-100 dark:border-amber-900/30">
                    <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-sm">Cambios no aplicados</h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        Los siguientes cambios no pudieron ser procesados.
                    </p>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2">
                    <ul className="space-y-1">
                        {errorItems.map((item, i) => (
                            <li key={i} className="text-sm text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <Link 
                                    href={pathForResolution({...item.context.rootResolution, ...item.context.structuralElement})}
                                    className="flex items-start gap-2 px-2 py-1.5 w-full h-full group"
                                    prefetch={false}
                                >
                                    <span className="text-gray-400 shrink-0 mt-0.5">•</span>
                                    <span className="flex-1">
                                        <span className="font-medium group-hover:underline decoration-gray-400 dark:decoration-gray-600 underline-offset-2">{item.source}</span>
                                        <span className="text-gray-500 dark:text-gray-400"> - {item.type}</span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </PopoverContent>
        </Popover>
    );
}
