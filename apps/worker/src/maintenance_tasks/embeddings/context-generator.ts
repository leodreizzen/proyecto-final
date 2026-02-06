import {
    AnnexToShow, ArticleToShow,
    ConsiderationToShow,
    RecitalToShow,
    ResolutionToShow
} from "@repo/resolution-assembly/definitions/resolutions";
import { formatAnnexIndex, formatArticleIndex } from "./helpers/formatting";
import { findAnnex, findChapter, resolveArticleReferences } from "./helpers/references";
import { ArticleLocation, IndexedBlock, MAX_CONTEXT_LENGTH } from "./definitions";

export function getContextForEmbedding(
    resolutionData: ResolutionToShow,
    referenceMap: Map<string, IndexedBlock[]>,
    block: { type: "RECITAL", recital: RecitalToShow } | {
        type: "CONSIDERATION",
        consideration: ConsiderationToShow
    } | {
        type: "ARTICLE",
        article: ArticleToShow,
        location: Omit<ArticleLocation, "articleIndex">
    } | { type: "TEXT_ANNEX", annex: AnnexToShow }
): string {
    let context = `Resolución ${resolutionData.id.initial}-${resolutionData.id.number}-${resolutionData.id.year}\n`;
    context += `Resumen: ${resolutionData.summary}\n\n`;

    if (block.type === "RECITAL") {
        context += "Tipo: Visto\n";
        context += `Visto número ${block.recital.number}:\n`;
    } else if (block.type === "CONSIDERATION") {
        context += "Tipo: Considerando\n";
        context += `Considerando número ${block.consideration.number}:\n`;
    } else if (block.type === "ARTICLE") {
        context += "Tipo: Artículo\n";
        let locationStr = formatArticleIndex(block.article.index);

        let extraStr = "";

        if (block.location.annexIndex !== null) {
            const annexIndex = block.location.annexIndex;
            locationStr += ` del ${formatAnnexIndex(annexIndex)}`;

            const parentAnnex = findAnnex(resolutionData, annexIndex);
            if (!parentAnnex) {
                throw new Error(`Anexo no encontrado: ${formatAnnexIndex(annexIndex)}`);
            }
            if (parentAnnex.type !== "WITH_ARTICLES") {
                throw new Error(`El anexo ${formatAnnexIndex(annexIndex)} no contiene artículos`);
            }
            if (parentAnnex.name && parentAnnex.name.trim().length > 0)
                extraStr += `Título del anexo: ${parentAnnex.name}\n`

            if (block.location.chapterNumber !== null) {
                const chapter = findChapter(parentAnnex, block.location.chapterNumber);
                if (!chapter) {
                    throw new Error(`Capítulo no encontrado: ${block.location.chapterNumber} en ${formatAnnexIndex(annexIndex)}`);
                }
                locationStr += `, Capítulo ${chapter.number}`;
                if (chapter.title && chapter.title.trim().length > 0)
                    extraStr += `Título del capítulo: ${chapter.title}\n`;
            }
        }
        context += `${locationStr}:\n`;
        context += extraStr;

        const references = resolveArticleReferences(block.article, resolutionData, referenceMap);

        let addedReferences = 0;
        const initialString = "Referencias relacionadas:\n";

        // Deduplicate references using a Set of target identifiers
        const seenTargets = new Set<string>();

        let last = false;
        for (const reference of references) {
            if (seenTargets.has(reference.target)) continue;
            seenTargets.add(reference.target);

            const totalLength = context.length;
            let cost = 0;
            if (addedReferences == 0) {
                cost += initialString.length + 1;
            }

            cost += reference.target.length + reference.text.length + 8; // approx, including formatting


            if (cost + totalLength > MAX_CONTEXT_LENGTH) {
                if (MAX_CONTEXT_LENGTH - totalLength >= cost / 2) {
                    last = true;
                    reference.text = reference.text.slice(0, MAX_CONTEXT_LENGTH - totalLength - reference.target.length - 11) + "...";
                } else {
                    // Not enough space for meaningful context
                    break;
                }
            }
            if (addedReferences === 0) {
                context += initialString;
            }
            context += `- [${reference.target}]:\n${reference.text}\n\n`;
            addedReferences++;
            if (last) {
                break;
            }
        }
    } else if (block.type === "TEXT_ANNEX") {
        context += "Tipo: Anexo de texto\n";
        context += `Anexo número ${formatAnnexIndex(block.annex.index)}:\n`;
    }
    context += "---------------------------------\n";
    return context;
}
