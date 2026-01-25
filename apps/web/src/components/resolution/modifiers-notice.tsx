import {ResolutionNaturalID} from "@/lib/definitions/resolutions";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {Button} from "@/components/ui/button";
import {Info} from "lucide-react";
import Link from "next/link";
import {pathForResolution} from "@/lib/paths";

export default function ModifiersNotice({modifications}: { modifications: ResolutionNaturalID[] }) {
    const modificationCount = modifications.length;
    return modificationCount > 0 ? (<DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm"
                    className="h-auto py-1! px-2! text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                <Info className="h-3 w-3 mr-1"/>
                Modificado por {modificationCount} {modificationCount === 1 ? 'resolución' : 'resoluciones'}
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
            <DropdownMenuLabel>Modificado por:</DropdownMenuLabel>
            <DropdownMenuSeparator/>
            {modifications.map((mod, idx) => (
                <DropdownMenuItem key={idx} asChild>
                    <Link href={pathForResolution(mod)} className="cursor-pointer">
                        Res. {mod.initial}-{mod.number}-{mod.year}
                    </Link>
                </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
    </DropdownMenu>) : null;
}
