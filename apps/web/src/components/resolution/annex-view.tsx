"use client";

import {AnnexToShow, ChapterToShow, ResolutionNaturalID} from "@/lib/definitions/resolutions";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import {AddedNotice} from "./added-notice";
import ModifiersNotice from "./modifiers-notice";
import Link from "next/link";
import {pathForResolution} from "@/lib/paths";
import ArticlesContainer from "@/components/resolution/articles-container";
import {cn} from "@/lib/utils";
import {getChapterId} from "@/lib/utils/resolution-formatters";

interface AnnexViewProps {
    annex: AnnexToShow;
    index: number;
}

// Helper for repealed content logic - adapted to match ArticleView style
function RepealedBlock({
                           repealedBy,
                           children,
                       }: {
    repealedBy: ResolutionNaturalID;
    children: React.ReactNode;
}) {
    const [show, setShow] = useState(false);

    return (
        <div className="space-y-1">
            <div className="flex items-baseline gap-2 text-muted-foreground">
                <span className="text-[1rem]">
                    Derogado por Res. <Link className="font-bold hover:underline"
                                            href={pathForResolution(repealedBy)}>{repealedBy.initial}-{repealedBy.number}-{repealedBy.year}</Link>.
                </span>
                <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShow(!show)}
                    className="h-auto p-0 text-xs"
                >
                    {show ? "Ocultar contenido anterior" : "Ver contenido anterior"}
                </Button>
            </div>

            {show && (
                <div className="mt-3 pl-4 border-l-2 border-muted-foreground/20 max-w-none text-justify">
                    <p className="text-[0.7rem] font-bold text-muted-foreground uppercase mb-2 tracking-wider">Contenido
                        anterior:</p>
                    <div className="prose prose-sm dark:prose-invert text-muted-foreground/80">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
}

function ChapterView({chapter, annexNumber}: { chapter: ChapterToShow, annexNumber: number }) {
    const titleText = `CAPÍTULO ${chapter.number}${chapter.title ? `: ${chapter.title}` : ""}`;
    const chapterId = getChapterId(annexNumber, chapter.number);
    const header = (
        <div className="flex flex-wrap items-center gap-2 mb-4">
            <h3 className="font-bold text-lg">
                {titleText}
            </h3>
            {chapter.repealedBy !== null && <span
                className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded border border-red-200 dark:border-red-900">DEROGADO</span>}
            <AddedNotice id={chapter.addedBy}/>
        </div>
    );

    const body = (
        <div className="space-y-6">
            <ArticlesContainer 
                articles={chapter.articles} 
                idPrefix={`annex-${annexNumber}-chap-${chapter.number}-art`} 
            />
        </div>
    );

    const Wrapper = ({children}: { children: React.ReactNode }) => (
        <section id={chapterId} className="mb-6 rounded-lg border border-dashed border-border/60 bg-muted/5 p-5">
            {children}
        </section>
    );

    if (chapter.repealedBy) {
        return (
            <Wrapper>
                {header}
                <RepealedBlock repealedBy={chapter.repealedBy}>
                    {body}
                </RepealedBlock>
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            {header}
            {body}
        </Wrapper>
    );
}

export function AnnexView({annex}: AnnexViewProps) {
    const isRepealed = annex.repealedBy !== null;
    const annexLabel = `ANEXO ${annex.number}`;
    const annexId = `annex-${annex.number}`;

    const modifications = (annex.type === "TEXT" && annex.modifiedBy) ? annex.modifiedBy : [];

    const header = (
        <div className={cn("flex flex-col items-center justify-center", (annex.addedBy || isRepealed || modifications.length > 0) && "mb-6")}>
            <h2 className="font-bold text-2xl text-center">
                {annexLabel}
            </h2>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
                {isRepealed && <span
                    className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded border border-red-200 dark:border-red-900">DEROGADO</span>}
                <AddedNotice id={annex.addedBy}/>
                {!isRepealed && modifications.length > 0 && <ModifiersNotice modifications={modifications}/>}
            </div>
        </div>
    );

    const body = annex.type === "WITH_ARTICLES" ? (
            <div>
                {annex.initialText && <p className="font-bold mb-4 text-center">{annex.initialText}</p>}

                <div className="flex flex-col gap-4">

                    {/* Standalone Articles */}
                    <ArticlesContainer 
                        articles={annex.standaloneArticles} 
                        className={(annex.standaloneArticles.length > 0 && annex.chapters.length > 0) ? "ml-6": ""}
                        idPrefix={`annex-${annex.number}-art`}
                    />

                    {/* Chapters */}
                    {annex.chapters.map((chapter, cIdx) => (
                        <ChapterView key={cIdx} chapter={chapter} annexNumber={annex.number} />
                    ))}
                </div>

                {annex.finalText && <p className="mt-4">{annex.finalText}</p>}
            </div>
        ) :
        (
            <div className="prose dark:prose-invert max-w-none">
                <p>{annex.content}</p>
            </div>
        );

    if (annex.repealedBy) {
        return (
            <div className="mt-12 pt-8 border-t" id={annexId}>
                {header}
                <RepealedBlock repealedBy={annex.repealedBy}>
                    {body}
                </RepealedBlock>
            </div>
        );
    }

    return (
        <div className="mt-12 pt-8 border-t" id={annexId}>
            {header}
            {body}
        </div>
    );
}