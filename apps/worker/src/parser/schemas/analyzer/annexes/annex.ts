import {z} from "zod";
import {ArticleSchema} from "@/parser/schemas/analyzer/article";

export const ChapterSchema = z.object({
    get articles() {
        return z.array(ArticleSchema).describe("Artículos presentes en el capítulo; puede no haber ninguno")
    }
}).meta({title: "CapituloAnexo", schemaDescription: "Capítulo dentro de un anexo"});

export const AnnexWithArticlesSchema = z.object({
    type: z.literal("WithArticles").describe("Anexo compuesto por artículos"),
    chapters: z.array(ChapterSchema).describe("Capítulos del anexo; puede no haber ninguno"),
    get articles() {
        return z.array(ArticleSchema).describe("Artículos sueltos del anexo; puede no haber ninguno.")
    }
}).meta({title: "AnexoArticulos"});

export type AnnexWithArticlesAnalysis = z.infer<typeof AnnexWithArticlesSchema>;

export const TextAnnexSchema = z.object({
    type: z.literal("TextOrTables").describe("Anexo de solo texto o tablas"),
}).meta({title: "AnexoTextoOTablas"});

export type TextAnnexAnalysis = z.infer<typeof TextAnnexSchema>;

export const AnnexSchema = z.discriminatedUnion("type", [
    AnnexWithArticlesSchema,
    TextAnnexSchema,
]).meta({title: "Anexo", schemaDescription: "Anexo de una resolución"});

export type AnnexAnalysis = z.infer<typeof AnnexSchema>;

