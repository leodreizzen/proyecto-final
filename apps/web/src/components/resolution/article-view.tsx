"use client";

import {ArticleToShow} from "@/lib/definitions/resolutions";
import {Button} from "@/components/ui/button";
import {useState} from "react";
import {TableRenderer} from "@/components/resolution/table-renderer";
import ModifiersNotice from "@/components/resolution/modifiers-notice";
import {AddedNotice} from "@/components/resolution/added-notice";
import {pathForResolution} from "@/lib/paths";
import Link from "next/link";
import {formatArticleTitle} from "@/lib/utils/resolution-formatters";
import MultiParagraphText from "@/components/ui/multi-paragraph-text";

interface ArticleViewProps {
    article: ArticleToShow;
    title?: string; // e.g. "ARTÍCULO 1º"
    htmlId?: string;
}

export function ArticleView({article, title, htmlId}: ArticleViewProps) {
    const modifications = article.modifiedBy || [];
    const [showRepealed, setShowRepealed] = useState(false);

    const articleTitle = title || formatArticleTitle(article.number, article.suffix);
    const idToUse = htmlId || `art-${article.number}${article.suffix > 0 ? `-${article.suffix}` : ''}`; // Fallback if no htmlId provided

    return (
        <div className="mb-6 group" id={idToUse}>
            <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3 className="font-bold text-lg">
                    {articleTitle}
                </h3>

                {article.repealedBy !== null && (
                    <span
                        className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded border border-red-200 dark:border-red-900">
                        DEROGADO
                    </span>
                )}
                
                <AddedNotice id={article.addedBy} />

                {article.repealedBy === null && <ModifiersNotice modifications={modifications}/>}
            </div>

            {article.repealedBy !== null ? (
                <div className="space-y-1">
                    <div className="flex items-baseline gap-2 text-muted-foreground">
                        <span className="text-[1rem]">
                            Derogado por Res. <Link className="font-bold hover:underline"
                                                    href={pathForResolution(article.repealedBy)}>{article.repealedBy.initial.toUpperCase()}-{article.repealedBy.number}-{article.repealedBy.year}</Link>.
                        </span>
                        <Button
                            variant="link"
                            size="sm"
                            onClick={() => setShowRepealed(!showRepealed)}
                            className="h-auto p-0 text-xs"
                        >
                            {showRepealed ? "Ocultar texto anterior" : "Ver texto anterior"}
                        </Button>
                    </div>

                    {showRepealed && (
                        <div className="mt-3 pl-4 border-l-2 border-muted-foreground/20 max-w-none text-justify">
                            <p className="text-[0.7rem] font-bold text-muted-foreground uppercase mb-2 tracking-wider">Texto anterior:</p>
                            <div className="prose prose-sm dark:prose-invert text-muted-foreground/80">
                                <MultiParagraphText text={article.text}/>
                                <TableRenderer tables={article.tables}/>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="prose dark:prose-invert max-w-none text-justify">
                        <MultiParagraphText text={article.text}/>
                    </div>
                    <TableRenderer tables={article.tables}/>
                </>
            )}
        </div>
    );
}