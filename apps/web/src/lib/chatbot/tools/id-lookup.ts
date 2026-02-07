import z from "zod";
import {getResolutionIdByNaturalKey} from "@/lib/data/resolutions";
import {getAssembledResolution} from "@repo/resolution-assembly";
import {
    AnnexIndex,
    ArticleIndex, ArticleToShow,
    ContentBlock,
    ResolutionToShow
} from "@repo/resolution-assembly/definitions/resolutions";
import {formatDateUTC, formatResolutionId} from "@/lib/utils";
import {getSuffixOrdinal} from "@/lib/utils/resolution-formatters";
import {idLookupToolSchema} from "@/lib/chatbot/tools/schemas";
import {tool} from "ai";

const MAX_CHARS = 4000;

export const idLookupTool = tool({
    description: "Busca una resolución universitaria por su ID único y devuelve información relevante sobre la misma.",
    inputSchema: idLookupToolSchema,

    inputExamples: [
        {
            input: {initial: "CSU", number: 60, year: 2025}
        }, {
            input: {initial: "R", number: 15, year: 2020}
        }, {
            input: {initial: "R", number: 15, year: 2020, page: 2}
        }
    ],
    title: "Obtener resolución por ID",
    strict: true,
    execute: async ({initial, number, year, page}) => {
        const resolutionId = await getResolutionIdByNaturalKey({initial, number, year});
        if (!resolutionId) {
            return `No se encontró ninguna resolución con el ID ${initial}-${number}-${year}. Por favor, verificá que el ID sea correcto.`;
        }
        const assembledRes = await getAssembledResolution(resolutionId, {date: null});
        if (!assembledRes) {
            return `Se encontró la resolución ${initial}-${number}-${year}, pero no se pudo obtener su contenido completo.`;
        }


        const text = formatResolutionForLLM(assembledRes.resolutionData, assembledRes.versions[0]!.date);

        const pageCount = Math.ceil(text.length / MAX_CHARS);
        if (page && (page < 1 || page > pageCount)) {
            return `La resolución ${initial}-${number}-${year} tiene ${pageCount} página(s) de contenido. El número de página solicitado (${page}) está fuera de rango.`;
        }

        const pageToUse = page || 1;
        const startIdx = (pageToUse - 1) * MAX_CHARS;
        const endIdx = Math.min(startIdx + MAX_CHARS, text.length);
        const pageText = text.slice(startIdx, endIdx);
        return pageText + `(Página ${pageToUse} de ${pageCount} (res. ${formatResolutionId(assembledRes.resolutionData.id)})`;
    }
})


function formatResolutionForLLM(assembledRes: ResolutionToShow, versionDate: Date): string {
    let result = `Resolución ${formatResolutionId(assembledRes.id)}\n`;
    if (assembledRes.repealedBy) {
        result += `IMPORTANTE: Esta resolución fue derogada por la resolución ${formatResolutionId(assembledRes.repealedBy)}\n`;
    }
    result += `Título: ${assembledRes.title}\n`;
    result += `Resumen: ${assembledRes.summary}\n`;
    result += `Fecha de emisión: ${assembledRes.date}\n`;
    result += `Fecha de la versión consultada: ${formatDateUTC(versionDate)}`
    result += `\n\nContenido de la resolución:\n`;

    if (assembledRes.recitals.length > 0) {
        result += 'Visto:\n';
        for (const recital of assembledRes.recitals) {
            result += `Artículo ${recital.number}:\n`;
            result += formatContentBlocksForLLM(recital.content);
        }
    }
    if (assembledRes.considerations.length > 0) {
        result += '\nConsiderando:\n';
        for (const consideration of assembledRes.considerations) {
            result += `Artículo ${consideration.number}:\n`;
            result += formatContentBlocksForLLM(consideration.content);
        }
    }

    result += `Por ello, el ${assembledRes.decisionBy}\n RESUELVE:\n`;

    for (const article of assembledRes.articles) {
        result += formatArticleForLLM(article);
    }

    if (assembledRes.annexes.length > 0) {
        for (const annex of assembledRes.annexes) {
            result += `----------------`;
            result += `Anexo ${formatAnnexIndexForLLM(annex.index)}`
            if (annex.name && annex.name.trim().length > 0) {
                result += ` - ${annex.name}\n`;
            }
            result += `\n`;
            if (annex.type === "TEXT") {
                result += formatContentBlocksForLLM(annex.content);
            } else if (annex.type === "WITH_ARTICLES") {
                if (annex.initialText) {
                    result += `${annex.initialText}\n`;
                }
                for (const article of annex.standaloneArticles) {
                    result += formatArticleForLLM(article);
                }
                for (const chapter of annex.chapters) {
                    result += `Capítulo ${chapter.number}: ${chapter.title || ""}\n`;
                    for (const article of chapter.articles) {
                        result += formatArticleForLLM(article);
                    }
                }
                if (annex.finalText) {
                    result += `${annex.finalText}\n`;
                }
            }
        }
    }

    return result;
}

function formatContentBlocksForLLM(blocks: ContentBlock[]): string {
    let result = '';
    for (const block of blocks) {
        if (block.type === "TEXT") {
            result += block.text + '\n';
        } else if (block.type === "TABLE") {
            result += '[Tabla]:\n';
            for (const row of block.tableContent.rows) {
                result += "| " + row.cells.map(cell => cell.text).join(' | ') + '|\n';
            }
        }
    }
    return result;
}

function formatArticleIndexForLLM(index: ArticleIndex): string {
    if (index.type === "defined") {
        return `${index.number}${getSuffixOrdinal(index.suffix)}`;
    } else {
        return `Sin número (Agregado Nº ${index.value})`
    }
}

function formatAnnexIndexForLLM(index: AnnexIndex): string {
    if (index.type === "defined") {
        return `${index.number}`;
    } else {
        return `Sin número (Agregado Nº ${index.value})`
    }
}

function formatArticleForLLM(article: ArticleToShow): string {
    let result = `Artículo ${formatArticleIndexForLLM(article.index)}:\n`;
    if (article.repealedBy)
        result += `IMPORTANTE: Este artículo fue derogado por la resolución ${formatResolutionId(article.repealedBy)}\n`;
    result += formatContentBlocksForLLM(article.content);
    return result;
}