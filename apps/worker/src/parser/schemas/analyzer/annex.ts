import {z} from "zod";
import {ArticleSchema} from "./article";
import {TextReferenceSchema} from "./reference";
import {ChangeSchema} from "./change";

export const ModificationAnnexArticleSchema = z.object({
    get changes() {
        return z.array(ChangeSchema).min(1).describe("Lista de cambios aplicables. Debe tener al menos uno")
    }
}).meta({
    title: "ArticuloAnexoModificaciones",
    schemaDescription: "Anexo que forma parte de un anexo de modificaciones"
});

export type ModificationAnnexArticleAnalysis = z.infer<typeof ModificationAnnexArticleSchema>;

export const ChapterSchema = z.object({
    get articles() {
        return z.array(ArticleSchema).describe("Artículos presentes en el capítulo; puede no haber ninguno")
    }
}).meta({title: "CapituloAnexo", schemaDescription: "Capítulo dentro de un anexo"});

export const AnnexArticleSchema = z.object({
    references: z.array(TextReferenceSchema).describe("Referencias; incluir anexos"),
}).meta({title: "ArticuloAnexo"});

export type AnnexArticle = z.infer<typeof AnnexArticleSchema>;

export const AnnexRegulationSchema = z.object({
    type: z.literal("WithArticles").describe("Anexo compuesto por artículos"),
    chapters: z.array(ChapterSchema).describe("Capítulos del anexo; puede no haber ninguno"),
    articles: z.array(AnnexArticleSchema).describe("Artículos sueltos del anexo; puede no haber ninguno."),
}).meta({title: "AnexoArticulos"});

export type AnnexRegulationAnalysis = z.infer<typeof AnnexRegulationSchema>;

export const TextAnnexSchema = z.object({
    type: z.literal("TextOrTables").describe("Anexo de solo texto o tablas"),
    references: z.array(TextReferenceSchema).describe("Referencias dentro del texto del anexo"),
}).meta({title: "AnexoTextoOTablas"});

export type TextAnnexAnalysis = z.infer<typeof TextAnnexSchema>;

// export const ModificationsAnnexSchema = z.object({
//     type: z.literal("Modifications").describe("Anexo que contiene solo modificaciones a artículos"),
//     articles: z.array(ModificationAnnexArticleSchema).describe("Artículos que forman parte del anexo de modificaciones. Deben ser modificadores"),
// }).meta({title: "AnexoModificaciones"});

// export type AnnexModificationsAnalysis = z.infer<typeof ModificationsAnnexSchema>;

export const AnnexSchema = z.discriminatedUnion("type", [
    AnnexRegulationSchema,
    TextAnnexSchema,
    // ModificationsAnnexSchema,
]).meta({title: "Anexo", schemaDescription: "Anexo de una resolución"});

export type AnnexAnalysis = z.infer<typeof AnnexSchema>;

export const ReplaceAnnexContent = z.object({
    type: z.literal("TextOrTables").describe("Anexo de solo texto o tablas"),
    references: z.array(TextReferenceSchema).describe("Referencias dentro del texto del anexo"),
    text: z.string().describe("Texto completo del anexo nuevo"),
}).meta({title: "ReemplazoAnexoContenidoNuevo"});