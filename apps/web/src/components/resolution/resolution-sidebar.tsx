import {ResolutionToShow, ResolutionVersion} from "@/lib/definitions/resolutions";
import {cn} from "@/lib/utils";
import {VersionSelector} from "./version-selector";
import {getSuffixOrdinal, getArticleId, getChapterId} from "@/lib/utils/resolution-formatters";
import {ScrollResetter} from "@/components/ui/scroll-resetter";
import {ScrollShadow} from "@heroui/react";

interface ResolutionSidebarProps {
    resolution: ResolutionToShow;
    className?: string;
    versions: ResolutionVersion[];
    currentVersion: ResolutionVersion;
}

function getArtLabel(num: number, suf: number) {
    const s = getSuffixOrdinal(suf);
    return `Art. ${num}º${s ? ` ${s}` : ''}`;
}

export function ResolutionSidebar({resolution, className, versions, currentVersion}: ResolutionSidebarProps) {
    return (
        <aside className={cn("flex flex-col gap-4 min-h-0", className)}>
            {/* Version Selector - Fixed at top of sidebar */}
            <div className="border rounded-lg bg-muted/30 h-[50%] flex flex-col overflow-hidden">
                <div className="p-4 pb-0 shrink-0">
                    <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Versiones</h3>
                </div>
                <div className="px-4 pb-2 flex-1 min-h-0 relative">
                    <ScrollShadow size={100}  className="h-full min-h-0">
                        <VersionSelector resolution={resolution} versions={versions} currentVersion={currentVersion}/>
                    </ScrollShadow>
                </div>
            </div>

            {/* Index - Scrollable area */}
            <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
                <ScrollResetter className="mb-3 shrink-0" scrollerID="content-scroller"><h3
                    className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Índice</h3>
                </ScrollResetter>
                <nav className="overflow-y-auto pr-2 min-h-0 flex-1">
                    <ul className="space-y-6 lg:space-y-3 text-sm pb-8">
                        <li>
                            <a href="#recitals" className="block hover:text-foreground transition-colors">
                                Visto
                            </a>
                        </li>
                        <li>
                            <a href="#considerations" className="block hover:text-foreground transition-colors">
                                Considerando
                            </a>
                        </li>
                        <li>
                            <a href="#main-articles" className="block font-medium hover:text-primary transition-colors">
                                Articulado
                            </a>
                            <ul className="mt-2 ml-4 space-y-4 lg:space-y-1 border-l pl-4">
                                {resolution.articles.map((art) => (
                                    <li key={`${art.number}-${art.suffix}`}>
                                        <a href={`#${getArticleId('art', art.number, art.suffix)}`}
                                           className="block text-muted-foreground hover:text-foreground truncate transition-colors">
                                            {getArtLabel(art.number, art.suffix)}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </li>
                        {resolution.annexes.length > 0 && (
                            <li>
                                <a href="#annexes"
                                   className="block font-medium mt-4 mb-2 hover:text-primary transition-colors">
                                    Anexos
                                </a>
                                <ul className="ml-4 space-y-8 lg:space-y-4 border-l pl-4">
                                    {resolution.annexes.map((annex, idx) => (
                                        <li key={idx}>
                                            <a href={`#annex-${annex.number}`}
                                               className="block font-medium text-foreground hover:text-primary transition-colors">
                                                Anexo {annex.number}
                                            </a>
                                            {annex.type === "WITH_ARTICLES" && (
                                                <ul className="mt-2 ml-2 space-y-5 lg:space-y-2">
                                                    {annex.chapters.map((chap, cIdx) => (
                                                        <li key={`c-${cIdx}`}>
                                                            <a href={`#${getChapterId(annex.number, chap.number)}`}
                                                               className="text-xs text-muted-foreground uppercase block mb-2 lg:mb-1">{`Capítulo ${chap.number}${chap.title ? ` - ${chap.title}` : ""}`}</a>
                                                            <ul className="ml-2 mt-1 space-y-4 lg:space-y-1 border-l pl-2">
                                                                {chap.articles.map((art) => (
                                                                    <li key={`ca-${art.number}-${art.suffix}`}>
                                                                        <a href={`#${getArticleId(`annex-${annex.number}-chap-${chap.number}-art`, art.number, art.suffix)}`}
                                                                           className="block text-xs text-muted-foreground hover:text-foreground truncate">
                                                                            {getArtLabel(art.number, art.suffix)}
                                                                        </a>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </li>
                                                    ))}
                                                    {annex.standaloneArticles.map((art) => (
                                                        <li key={`aa-${art.number}-${art.suffix}`}>
                                                            <a href={`#${getArticleId(`annex-${annex.number}-art`, art.number, art.suffix)}`}
                                                               className="block text-xs text-muted-foreground hover:text-foreground truncate">
                                                                {getArtLabel(art.number, art.suffix)}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        )}
                    </ul>
                </nav>
            </div>
        </aside>
    );
}
