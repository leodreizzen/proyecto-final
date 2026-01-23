"use client";

import {ResolutionToShow, ResolutionVersion} from "@/lib/definitions/resolutions";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { ResolutionSidebar } from "./resolution-sidebar";
import { useState } from "react";

interface MobileMenuProps {
    resolution: ResolutionToShow;
    versions: ResolutionVersion[];
    currentVersion: ResolutionVersion;
}

export function MobileMenu({ resolution, versions, currentVersion }: MobileMenuProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className="lg:hidden flex items-center justify-between p-4 border-b bg-background">
            <div className="flex-1 min-w-0 mr-4">
                <h1 className="font-serif font-bold text-lg truncate">
                    Res. {resolution.id.initial}-{resolution.id.number}-{resolution.id.year}
                </h1>
            </div>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Menú</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] sm:w-[350px] overflow-y-auto p-6">
                    <SheetTitle>Índice y Versiones</SheetTitle>
                    <SheetDescription className="sr-only">
                        Navegación de la resolución
                    </SheetDescription>
                    <div className="mt-2">
                         <ResolutionSidebar resolution={resolution} versions={versions} currentVersion={currentVersion}/>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}