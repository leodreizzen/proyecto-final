import {ResolutionToShow} from "@/lib/definitions/resolutions";
import {AnnexView} from "./annex-view";
import ArticlesContainer from "@/components/resolution/articles-container";
import {ContentBlockRenderer} from "@/components/resolution/content-block-renderer";

interface ResolutionBodyProps {
    resolution: ResolutionToShow;
}

function RecitalsView({recitals, hasConsiderations}: {
    recitals: ResolutionToShow['recitals'],
    hasConsiderations: boolean
}) {
    if (recitals.length === 0) return null;
    return (
        <div className="mb-8" id="recitals">
            <h2 className="font-bold text-xl mb-4">VISTO:</h2>
            <div className="space-y-4">
                {recitals.map((r, i) => {
                    const isLastRecital = i === recitals.length - 1;
                    let content = r.content;

                    if (content.length > 0) {
                        const lastBlock = content[content.length - 1]!;
                        if (lastBlock.type === "TEXT") {
                            let suffix = ";";
                            if (isLastRecital && hasConsiderations) {
                                suffix += " y,";
                            }
                            
                            // To avoid double punctuation if it was already there
                            const text = lastBlock.text.trimEnd();
                            const newText = text.endsWith(";") ? text.substring(0, text.length - 1) + suffix : text + suffix;

                            content = [...content.slice(0, -1), { ...lastBlock, text: newText }];
                        }
                    }

                    return (
                        <div key={i} className="text-justify">
                            <ContentBlockRenderer content={content} />
                        </div>
                    )
                })
                }
            </div>
        </div>
    );
}

function ConsiderationsView({considerations}: { considerations: ResolutionToShow['considerations'] }) {
    if (considerations.length === 0) return null;
    return (
        <div className="mb-8" id="considerations">
            <h2 className="font-bold text-xl mb-4">CONSIDERANDO:</h2>
            <div className="space-y-4">
                {considerations.map((c, i) => {
                    let content = c.content;
                    if (content.length > 0) {
                        const lastBlock = content[content.length - 1]!;
                        if (lastBlock.type === "TEXT") {
                            const text = lastBlock.text.trimEnd();
                            const newText = text.endsWith(";") ? text : text + ";";
                            content = [...content.slice(0, -1), { ...lastBlock, text: newText }];
                        }
                    }
                    return (
                        <div key={i} className="text-justify">
                            <ContentBlockRenderer content={content} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function getDecisionByArticle(decisionBy: string) {
    const upper = decisionBy.toUpperCase().trim();
    if (upper.startsWith("ASAMBLEA") ||
        upper.startsWith("SECRETARÍA") ||
        upper.startsWith("SECRETARIA") ||
        upper.startsWith("JUNTA") ||
        upper.startsWith("COMISIÓN") ||
        upper.startsWith("COMISION") ||
        upper.startsWith("DIRECCIÓN") ||
        upper.startsWith("DIRECCION") ||
        upper.split(" ")[0]!.endsWith("A")) {
        return "LA";
    }
    return "EL";
}

export function ResolutionBody({resolution}: ResolutionBodyProps) {
    const article = getDecisionByArticle(resolution.decisionBy);

    return (
        <div className="font-serif leading-relaxed text-lg">
            <RecitalsView recitals={resolution.recitals} hasConsiderations={resolution.considerations.length > 0}/>

            <ConsiderationsView considerations={resolution.considerations}/>

            <div className="mb-8 text-left">
                <p>Por ello,</p>
            </div>

            <div className="mb-12 font-bold text-xl text-center">
                <p className="uppercase">
                    {article} {resolution.decisionBy.toUpperCase()}
                </p>
                <p>RESUELVE:</p>
            </div>

            <div id="main-articles">
                <ArticlesContainer articles={resolution.articles}/>
            </div>

            <div id="annexes">
                {resolution.annexes.map((annex, idx) => (
                    <AnnexView key={idx} annex={annex} index={idx}/>
                ))}
            </div>
        </div>
    );
}

