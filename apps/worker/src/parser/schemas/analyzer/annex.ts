import {z} from "zod";
import {ArticleSchema} from "./article";
import {TextReference} from "./reference";
import {ChangeSchema} from "./change";

export const ModificationAnnexArticleSchema = z.object({
    get changes() {
        return z.array(ChangeSchema).min(1).describe("Lista de cambios aplicables. Debe tener al menos uno")
    }
}).meta({
    title: "ArticuloAnexoModificaciones",
    schemaDescription: "Anexo que forma parte de un anexo de modificaciones"
});

export const ChapterSchema = z.object({
    get articles() {
        return z.array(ArticleSchema).describe("Artículos presentes en el capítulo; puede no haber ninguno")
    }
}).meta({title: "CapituloAnexo", schemaDescription: "Capítulo dentro de un anexo"});

export const AnnexArticleSchema = z.object({
    references: z.array(TextReference).describe("Referencias; incluir anexos"),
}).meta({title: "ArticuloAnexo"});

export const AnnexRegulationSchema = z.object({
    type: z.literal("Regulation").describe("Anexo tipo reglamento/manual, compuesto por artículos"),
    chapters: z.array(ChapterSchema).describe("Capítulos del anexo; puede no haber ninguno"),
    looseArticles: z.array(AnnexArticleSchema).describe("Artículos sueltos del anexo; puede no haber ninguno"),
}).meta({title: "AnexoReglamento"});

export const TextAnnexSchema = z.object({
    type: z.literal("TextOrTables").describe("Anexo de solo texto o tablas"),
    references: z.array(TextReference).describe("Referencias dentro del texto del anexo"),
}).meta({title: "AnexoTextoOTablas"});

export const ModificationsAnnexSchema = z.object({
    type: z.literal("Modifications").describe("Anexo que contiene solo modificaciones a artículos"),
    articles: z.array(ModificationAnnexArticleSchema).describe("Artículos que forman parte del anexo de modificaciones. Deben ser modificadores"),
}).meta({title: "AnexoModificaciones"});

export const AnnexSchema = z.discriminatedUnion("type", [
    AnnexRegulationSchema,
    TextAnnexSchema,
    ModificationsAnnexSchema,
]).meta({title: "Anexo", schemaDescription: "Anexo de una resolución"});
