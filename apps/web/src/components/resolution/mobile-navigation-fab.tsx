"use client";

import {ResolutionToShow, ResolutionVersion} from "@/lib/definitions/resolutions";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { List } from "lucide-react";
import { ResolutionSidebar } from "./resolution-sidebar";
import { useState } from "react";

interface MobileNavigationFABProps {
    resolution: ResolutionToShow;
    versions: ResolutionVersion[];
    currentVersion: ResolutionVersion;
}

export function MobileNavigationFAB({ resolution, versions, currentVersion }: MobileNavigationFABProps) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="pointer-events-auto">
                <Button className="rounded-full shadow-2xl px-6 h-12 gap-2 border-2 border-primary/20" size="lg">
                    <List className="h-5 w-5" />
                    Índice y Versiones
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl p-0">
                <div className="p-6 h-full flex flex-col">
                    <SheetTitle className="mb-4">Índice y Versiones</SheetTitle>
                    <SheetDescription className="sr-only">
                        Navegación de la resolución y selector de versiones históricas
                    </SheetDescription>
                    <div className="flex-1 overflow-hidden">
                            <ResolutionSidebar resolution={resolution} versions={versions} currentVersion={currentVersion} className="h-full"/>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}