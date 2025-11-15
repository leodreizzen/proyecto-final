import {ArticleStructureSchema} from "@/parser/schemas/structure_parser/article";
import z from "zod";

export const AnnexStructureSchema = z.object({
    name: z.string().optional().nullable().describe("Nombre del anexo, si lo tiene"),
    number: z.number().describe("Número del anexo. Si no se especifica, deducir de acuerdo al orden"),
    type: z.literal("TextOrTables").describe("Anexo de texto o tablas"),
    content: z.string().describe("Contenido textual del anexo, sin resumir, al pie de la letra. Usar {{tabla X}} para referenciar tablas presentes en la resolución (no indicar acá su contenido)"),
}).meta({title: "AnexoTexto", schemaDescription: "Anexo de texto o tablas. NO ESTÁ COMPUESTO POR ARTÍCULOS."})

const ChapterSchema = z.object({
    number: z.number().describe("Número del capítulo"),
    title: z.string().describe("Título del capítulo"),
    articles: z.array(ArticleStructureSchema).describe("Artículos del capítulo")
}).meta({title: "Capitulo", schemaDescription: "Capítulo que contiene artículos."});
export type ChapterStructure = z.infer<typeof ChapterSchema>;


export type TextAnnexStructure = z.infer<typeof AnnexStructureSchema>;

export const ArticleAnnexSchema = z.object({
    name: z.string().optional().nullable().describe("Nombre del anexo, si lo tiene"),
    number: z.number().describe("Número del anexo. Si no se especifica, deducir de acuerdo al orden"),
    type: z.literal("WithArticles").describe("Anexo compuesto por al menos 1 artículo"),
    articles: z.array(ArticleStructureSchema).describe("Artículos del anexo que no pertenecen a ningún capítulo"),
    chapters: z.array(ChapterSchema).describe("Capítulos del anexo; puede no haber ninguno"),
    initialText: z.string().optional().nullable().describe("Texto inicial del anexo"),
    finalText: z.string().optional().nullable().describe("Texto final del anexo"),
}).refine(annex =>
    annex.articles.length > 0 || (annex.chapters.length > 0 && annex.chapters.flatMap(c => c.articles).length > 0), {error: "Regulation annex must have at least one article, either loose or in chapters"}
).meta({title: "AnexoArticulos", schemaDescription: "Anexo compuesto por artículos. Debe tener al menos 1 artículo"})

export type annex = z.infer<typeof ArticleAnnexSchema>;
export const AnnexSchema = z.discriminatedUnion("type", [
    AnnexStructureSchema,
    ArticleAnnexSchema,
]).meta({
    title: "Anexo",
    schemaDescription: "Anexo de la resolución, puede ser de texto o de artículos. Solamente es de artículos si dice 'Artículo x' en algún lado"
})

export type AnnexStructure = z.infer<typeof AnnexSchema>;