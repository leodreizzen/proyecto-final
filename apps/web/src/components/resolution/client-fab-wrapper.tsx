"use client";

import { useState, useEffect, useRef } from "react";
import { MobileNavigationFAB } from "./mobile-navigation-fab";
import { ResolutionToShow, ResolutionVersion } from "@/lib/definitions/resolutions";

interface ResolutionFabWrapperProps {
    children: React.ReactNode;
    resolution: ResolutionToShow;
    versions: ResolutionVersion[];
    currentVersion: ResolutionVersion;
}

export function ResolutionFabWrapper({
                                         children,
                                         resolution,
                                         versions,
                                         currentVersion
                                     }: ResolutionFabWrapperProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isAtBottom, setIsAtBottom] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            setIsAtBottom(rect.bottom <= window.innerHeight - 24);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div ref={containerRef} className="lg:col-span-3 min-h-[50vh] pt-8 md:pt-12 relative">

            {children}

            <div
                className={`
                    lg:hidden transition-all duration-300 z-50
                    ${isAtBottom
                    ? 'absolute bottom-6 left-1/2 -translate-x-1/2'
                    : 'fixed bottom-6 right-4 mx-auto'
                }
                `}
            >
                <MobileNavigationFAB
                    resolution={resolution}
                    versions={versions}
                    currentVersion={currentVersion}
                />
            </div>
        </div>
    );
}