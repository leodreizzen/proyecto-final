import {ResolutionToShow, ResolutionVersion} from "@/lib/definitions/resolutions";
import {InapplicableChange} from "@/lib/definitions/changes";
import {AIWarning} from "./ai-warning";
import {VersionStatus} from "./version-status";
import {ResolutionHeader} from "./resolution-header";
import {ResolutionBody} from "./resolution-body";
import {ResolutionSidebar} from "./resolution-sidebar";
import {ResolutionFabWrapper} from "@/components/resolution/client-fab-wrapper";

interface ResolutionViewerProps {
    resolution: ResolutionToShow;
    versions: ResolutionVersion[];
    currentVersion: ResolutionVersion;
    inapplicableChanges: InapplicableChange[];
}

export function ResolutionViewer({resolution, versions, currentVersion, inapplicableChanges}: ResolutionViewerProps) {
    const isCurrentVersion = versions[0]! === currentVersion;

    return (
        <div className="bg-background text-foreground min-h-screen flex justify-center">
            <div className="max-md:px-8 lg:px-8 pb-20 lg:pb-12 container mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative">

                    <ResolutionFabWrapper
                        resolution={resolution}
                        versions={versions}
                        currentVersion={currentVersion}
                    >
                        <div className="w-full pe-0 lg:pe-6">
                            <div className="bg-background md:bg-card md:shadow-lg md:border rounded-xl overflow-hidden min-h-fit">

                                {/* Version Status - Desktop */}
                                <div className="hidden lg:block">
                                    <VersionStatus resolution={resolution} isCurrentVersion={isCurrentVersion}/>
                                </div>

                                {/* Version Status - Mobile */}
                                <div className="lg:hidden mb-6">
                                    <VersionStatus resolution={resolution} isCurrentVersion={isCurrentVersion}/>
                                </div>

                                <div className="p-0 max-lg:pb-20 md:px-10 md:pt-10 lg:pb-10">
                                    <AIWarning/>
                                    <ResolutionHeader
                                        resolution={resolution}
                                        versions={versions}
                                        currentVersion={currentVersion}
                                        inapplicableChanges={inapplicableChanges}
                                    />
                                    <ResolutionBody resolution={resolution}/>
                                </div>

                            </div>
                        </div>
                    </ResolutionFabWrapper>

                    <div className="hidden lg:block lg:col-span-1 pt-12 h-full">
                        <div className="sticky top-24 h-[calc(100vh-6rem)] custom-scrollbar">
                        <ResolutionSidebar
                            resolution={resolution}
                            versions={versions}
                            currentVersion={currentVersion}
                            className=""
                        />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}