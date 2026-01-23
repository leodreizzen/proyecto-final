import {ResolutionToShow, ResolutionVersion} from "@/lib/definitions/resolutions";
import { AIWarning } from "./ai-warning";
import { VersionStatus } from "./version-status";
import { ResolutionHeader } from "./resolution-header";
import { ResolutionBody } from "./resolution-body";
import { ResolutionSidebar } from "./resolution-sidebar";
import { MobileMenu } from "./mobile-menu";

interface ResolutionViewerProps {
    resolution: ResolutionToShow;
    versions: ResolutionVersion[];
    currentVersion: ResolutionVersion;
}

export function ResolutionViewer({ resolution, versions, currentVersion }: ResolutionViewerProps) {
    const isCurrentVersion = versions[0]! === currentVersion;
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Mobile Header & Sticky Status */}
            <div className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:static lg:bg-transparent">
                 {/* Version Status - Mobile Sticky if present */}
                 <div className="lg:hidden">
                    <VersionStatus resolution={resolution} isCurrentVersion={isCurrentVersion} />
                 </div>
                 
                 {/* Mobile Menu Bar */}
                 <MobileMenu resolution={resolution} versions={versions} currentVersion={currentVersion}/>
            </div>

            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Content Area */}
                    <main className="lg:col-span-3">
                        {/* The "Paper" */}
                        <div className="bg-background md:bg-card md:shadow-lg md:border rounded-xl overflow-hidden min-h-screen">
                            
                            {/* Version Status - Desktop (Full Width inside Paper) */}
                            <div className="hidden lg:block">
                                <VersionStatus resolution={resolution} isCurrentVersion={isCurrentVersion} />
                            </div>

                            <div className="p-6 md:p-10">
                                {/* AI Warning */}
                                <AIWarning />

                                {/* Header */}
                                <ResolutionHeader 
                                    resolution={resolution} 
                                />

                                {/* Body */}
                                <ResolutionBody resolution={resolution} />
                            </div>
                        </div>
                    </main>

                    {/* Sidebar Area - Desktop Only */}
                    <div className="hidden lg:block lg:col-span-1">
                        <ResolutionSidebar resolution={resolution} versions={versions} currentVersion={currentVersion}/>
                    </div>
                </div>
            </div>
        </div>
    );
}