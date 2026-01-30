import {ResolutionToShow, ResolutionVersion, ArticleIndex} from "@/lib/definitions/resolutions";
import {cn} from "@/lib/utils";
import {VersionSelector} from "./version-selector";
import {getSuffixOrdinal, getArticleId, getChapterId} from "@/lib/utils/resolution-formatters";
import {ScrollShadow} from "@heroui/react";
import {ScrollResetter} from "@/components/ui/scroll-resetter";

interface ResolutionSidebarProps {
    resolution: ResolutionToShow;
    className?: string;
    versions: ResolutionVersion[];
    currentVersion: ResolutionVersion;
}

function getArtLabel(index: ArticleIndex) {
    if (index.type === "generated") return "Art. (S/N)";
    const s = getSuffixOrdinal(index.suffix);
    return `Art. ${index.number}º${s ? ` ${s}` : ''}`;
}

export function ResolutionSidebar({resolution, className, versions, currentVersion}: ResolutionSidebarProps) {
    return (
        <aside className={cn("flex flex-col h-full gap-4 overflow-hidden", className)}>
            <div className="h-1/2 border rounded-lg bg-muted/30 shrink-0 flex flex-col overflow-hidden">
                <div className="p-4 pb-2 shrink-0">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Versiones</h3>
                </div>
                <div className="px-4 pb-2 flex-1 min-h-0 relative">
                    <ScrollShadow size={40} className="h-full overflow-y-auto">
                        <VersionSelector resolution={resolution} versions={versions} currentVersion={currentVersion}/>
                    </ScrollShadow>
                </div>
            </div>

            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="mb-3 shrink-0">
                    <ScrollResetter scrollerSelector=":root"><h3
                        className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Índice</h3>
                    </ScrollResetter>
                </div>

                <nav className="flex-1 overflow-y-auto pr-2 scrollbar-thin pb-4">
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
                            <ul className="mt-2 ml-4 space-y-1 border-l pl-4">
                                {resolution.articles.map((art) => (
                                    <li key={art.index.type === "generated" ? `gen-${art.index.value}` : `${art.index.number}-${art.index.suffix}`}>
                                        <a href={`#${getArticleId('art', art.index)}`}
                                           className="block text-muted-foreground hover:text-foreground truncate transition-colors">
                                            {getArtLabel(art.index)}
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
                                <ul className="ml-4 space-y-4 border-l pl-4">
                                    {resolution.annexes.map((annex, idx) => (
                                        <li key={idx}>
                                            <a href={`#${annex.index.type === "generated" ? `annex-gen-${annex.index.value}` : `annex-${annex.index.number}`}`}
                                               className="block font-medium text-foreground hover:text-primary transition-colors">
                                                Anexo {annex.index.type === "generated" ? "(S/N)" : annex.index.number}
                                            </a>
                                            {annex.type === "WITH_ARTICLES" && (
                                                <ul className="mt-2 ml-2 space-y-2">
                                                    {annex.chapters.map((chap, cIdx) => (
                                                        <li key={`c-${cIdx}`}>
                                                            <a href={`#${getChapterId(annex.index, chap.number)}`}
                                                               className="text-xs text-muted-foreground uppercase block mb-1">{`Capítulo ${chap.number}${chap.title ? ` - ${chap.title}` : ""}`}</a>
                                                            <ul className="ml-2 mt-1 space-y-1 border-l pl-2">
                                                                {chap.articles.map((art) => (
                                                                    <li key={art.index.type === "generated" ? `c-gen-${art.index.value}` : `ca-${art.index.number}-${art.index.suffix}`}>
                                                                        <a href={`#${getArticleId(`annex-${annex.index.type === "generated" ? `gen-${annex.index.value}` : annex.index.number}-chap-${chap.number}-art`, art.index)}`}
                                                                           className="block text-xs text-muted-foreground hover:text-foreground truncate">
                                                                            {getArtLabel(art.index)}
                                                                        </a>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </li>
                                                    ))}
                                                    {annex.standaloneArticles.map((art) => (
                                                        <li key={art.index.type === "generated" ? `a-gen-${art.index.value}` : `aa-${art.index.number}-${art.index.suffix}`}>
                                                            <a href={`#${getArticleId(`annex-${annex.index.type === "generated" ? `gen-${annex.index.value}` : annex.index.number}-art`, art.index)}`}
                                                               className="block text-xs text-muted-foreground hover:text-foreground truncate">
                                                                {getArtLabel(art.index)}
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