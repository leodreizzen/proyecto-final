import {tool} from 'ai';
import {z} from "zod";
import {searchResolutionsByKeyword, searchResolutionsBySemantic} from "@/lib/data/search";
import {SearchableContentWithResolution} from "@/lib/definitions/resolutions";
import {searchToolSchema} from "@/lib/chatbot/tools/schemas";

export const searchTool = tool({
    description: "Busca resoluciones en la base de datos por palabras clave o por significado. Obtiene partes de resoluciones relevantes para una consulta dada.",
    inputSchema: searchToolSchema,
    strict: true,
    execute: async({searchType, query, cursor}) => {
        try {
            if (searchType === 'KEYWORD') {
                const results = await searchResolutionsByKeyword(query, cursor);
                return formatSearchResults(results);
            }
            else {
                const results = await searchResolutionsBySemantic(query, cursor);
                return formatSearchResults(results);
            }
        } catch (error) {
            console.error("Error executing searchTool:", error);
            throw error;
        }
    },
    title: "Búsqueda de resoluciones universitarias",
})


export async function formatSearchResults(results: SearchableContentWithResolution[]) {
    const mapped = results.map(result => ({
        resolution: {
            id: result.resolution.id,
            initial: result.resolution.initial,
            number: result.resolution.number,
            year: result.resolution.year,
            date: result.resolution.date,
            title: result.resolution.title,
        },
        content: result.context + result.mainText,
    }));
    return mapped;
}