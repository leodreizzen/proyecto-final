import {z} from "zod";

import {ResolutionIDSchema} from "@/parser/schemas/common";

export const ResolutionReferenceSchema = z.object({
    referenceType: z.literal("Resolution"),
    resolutionId: ResolutionIDSchema.describe("ID de la resolución referida"),
}).meta({title: "ReferenciaResolucion", schemaDescription: "Referencia a una resolución"});

export const AnnexReferenceSchema = z.object({
    referenceType: z.literal("Annex"),
    resolutionId: ResolutionIDSchema.describe("ID de la resolución que contiene el anexo"),
    number: z.coerce.number().describe("Número del anexo"),
}).meta({title: "ReferenciaAnexo", schemaDescription: "Referencia a un anexo dentro de una resolución"});

export const ChapterReferenceSchema = z.object({
    referenceType: z.literal("Chapter"),
    annex: AnnexReferenceSchema.describe("Anexo que contiene el capítulo"),
    number: z.coerce.number().describe("Número del capítulo dentro del anexo"),
}).meta({title: "ReferenciaCapitulo", schemaDescription: "Referencia a un capítulo dentro de un anexo"});


export const NormalArticleReferenceSchema = z.object({
    referenceType: z.literal("NormalArticle"),
    resolutionId: ResolutionIDSchema.describe("ID de la resolución que contiene el artículo"),
    number: z.coerce.number().describe("Número del artículo"),
    suffix: z.string().optional().nullable().describe("Sufijo del artículo, ej. 'bis'; opcional"),
}).meta({
    title: "ReferenciaArticuloNormal",
    schemaDescription: "Referencia a un artículo de una resolución, fuera de anexos"
});


export const AnnexArticleReferenceSchema = z.object({
    referenceType: z.literal("AnnexArticle"),
    annex: AnnexReferenceSchema.describe("Anexo que contiene el artículo"),
    number: z.coerce.number().describe("Número del artículo"),
    suffix: z.string().optional().nullable().describe("Sufijo del artículo, ej. 'bis'; opcional"),
}).meta({
    title: "ReferenciaArticuloAnexo",
    schemaDescription: "Referencia a un artículo dentro de un anexo de una resolución"
});

export const ArticleReferenceSchema = z.discriminatedUnion("referenceType", [
    NormalArticleReferenceSchema,
    AnnexArticleReferenceSchema,
]).meta({title: "ReferenciaArticle"});

export const ReferenceSchema = z.discriminatedUnion("referenceType", [
    ResolutionReferenceSchema,
    AnnexReferenceSchema,
    ChapterReferenceSchema,
    NormalArticleReferenceSchema,
    AnnexArticleReferenceSchema
]).meta({title: "Referencia", schemaDescription: "Referencia a resolución, anexo, capítulo o artículo"});

export const TextReferenceSchema = z.object({
    before: z.string().describe("Texto antes de la referencia. No más de 5 palabras, salvo que en el mismo artículo haya otra referencia igual"),
    after: z.string().describe("Texto después de la referencia. No más de 5 palabras, salvo que en el mismo artículo haya otra referencia igual"),
    text: z.string().describe("Texto con la referencia"),
    reference: ReferenceSchema.describe("Elemento referenciado"),
}).meta({title: "ReferenciaTexto", schemaDescription: "Referencia dentro de un texto, con contexto antes y después. Solo se puede referenciar a resoluciones de la UNS y su contenido"});

export type TextReference = z.infer<typeof TextReferenceSchema>;