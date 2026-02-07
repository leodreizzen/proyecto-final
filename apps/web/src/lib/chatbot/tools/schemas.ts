import z from "zod";
import {FormattedSearchResults} from "@/lib/chatbot/tools/search";

export const idLookupToolSchema = z.object({
    initial: z.string().min(1, "La inicial de la resolución no puede estar vacía.").describe("La inicial de la resolución, por ejemplo 'CSU' o 'REC"),
    number: z.number().min(1, "El número de la resolución debe ser un entero positivo.").describe("El número de la resolución, por ejemplo 60"),
    year: z.number().min(1900, "El año debe ser un número válido.").max(new Date().getFullYear(), "El año no puede ser en el futuro.").describe("El año de la resolución, por ejemplo 2025"),
    page: z.number().min(1).optional().describe("Número de página a devolver, si la resolución está paginada. Usar solo cuando ya obtuviste una versión páginada"),
})

export type IdLookupInput = z.infer<typeof idLookupToolSchema>;

export const searchToolSchema = z.object({
    searchType: z.enum(['SEMANTIC', 'KEYWORD']).describe("Tipo de búsqueda a realizar: SEMANTIC para búsqueda semántica, KEYWORD para búsqueda por palabras clave."),
    query: z.string().min(1, "La consulta de búsqueda no puede estar vacía."),
    cursor: z.string().optional().describe("Cursor para paginación de resultados. Usa el id de la última resolución del conjunto de resultados anterior."),
})

export type SearchToolInput = z.infer<typeof searchToolSchema>;

export type SearchToolOutput = FormattedSearchResults