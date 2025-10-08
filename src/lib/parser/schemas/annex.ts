import {z} from "zod";
import {ArticleSchema} from "./article";
import {ReferenceSchema} from "./reference";
import {TextModel} from "./common";
import {ChangeSchema} from "./change";

export const ModificationAnnexArticleSchema = z.object({
    number: z.coerce.number().describe("Número del artículo modificado"),
    suffix: z.string().optional().nullable().describe("Sufijo del artículo modificado, ej. 'bis'"),
    get changes() {
        return z.array(ChangeSchema).min(1).describe("Lista de cambios aplicables. Debe tener al menos uno")
    }
}).meta({
    title: "ArticuloAnexoModificaciones",
    schemaDescription: "Anexo que forma parte de un anexo de modificaciones"
});

export const ChapterSchema = z.object({
    number: z.coerce.number().describe("Número del capítulo"),
    name: z.string().optional().nullable().describe("Nombre del capítulo"),
    get articles() {
        return z.array(ArticleSchema).describe("Artículos presentes en el capítulo; puede no haber ninguno")
    }
}).meta({title: "CapituloAnexo", schemaDescription: "Capítulo dentro de un anexo"});

export const AnnexBaseSchema = z.object({
    number: z.coerce.number().describe("Número del anexo"),
    name: z.string().optional().nullable().describe("Nombre del anexo, ej. reglamento actividad estudiantil"),
});

export const AnnexArticleSchema = z.object({
    number: z.coerce.number().describe("Número del artículo"),
    suffix: z.string().optional().nullable().describe("Sufijo del artículo, ej. 'bis'"),
    text: TextModel.describe("Texto del artículo, como aparece en la resolución"),
    references: z.array(ReferenceSchema).describe("Referencias; incluir anexos"),
}).meta({title: "ArticuloAnexo"});

export const AnnexRegulationSchema = AnnexBaseSchema.extend({
    type: z.literal("Regulation").describe("Anexo tipo reglamento/manual, compuesto por artículos"),
    initialText: z.string().optional().nullable().describe("Texto inicial del anexo"),
    chapters: z.array(ChapterSchema).describe("Capítulos del anexo; puede no haber ninguno"),
    looseArticles: z.array(AnnexArticleSchema).describe("Artículos sueltos del anexo; puede no haber ninguno"),
    finalText: z.string().optional().nullable().describe("Texto final del anexo"),
    get annexes() {
        return z.array(AnnexSchema).describe("Anexos dentro del anexo; puede no haber ninguno")
    }
}).meta({title: "AnexoReglamento"});

export const TextAnnexSchema = AnnexBaseSchema.extend({
    type: z.literal("TextOrTables").describe("Anexo de solo texto o tablas"),
    content: TextModel.describe("Contenido del anexo"),
}).meta({title: "AnexoTextoOTablas"});

export const ModificationsAnnexSchema = AnnexBaseSchema.extend({
    type: z.literal("Modifications").describe("Anexo que contiene solo modificaciones a artículos"),
    articles: z.array(ModificationAnnexArticleSchema).describe("Artículos que forman parte del anexo de modificaciones. Deben ser modificadores"),
}).meta({title: "AnexoModificaciones"})

export const AnnexSchema: z.ZodType<any> = z.discriminatedUnion("type", [
    AnnexRegulationSchema,
    TextAnnexSchema,
    ModificationsAnnexSchema,
]).meta({title: "Anexo", schemaDescription: "Anexo de una resolución"});
