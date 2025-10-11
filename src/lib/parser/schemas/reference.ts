import {z} from "zod";

import {ResolutionIDSchema} from "./common";

export const ResolutionReferenceSchema = z.object({
    referenceType: z.literal("Resolution"),
    resolutionId: ResolutionIDSchema.describe("ID de la resolución referida"),
}).meta({title: "ReferenciaResolucion", schemaDescription: "Referencia a una resolución"});

export const AnnexReferenceSchema = z.object({
    referenceType: z.literal("Annex"),
    resolution: z.string().describe("ID de la resolución que contiene el anexo"),
    number: z.coerce.number().describe("Número del anexo"),
}).meta({title: "ReferenciaAnexo", schemaDescription: "Referencia a un anexo dentro de una resolución"});

export const ChapterReferenceSchema = z.object({
    referenceType: z.literal("Chapter"),
    annex: AnnexReferenceSchema.describe("Anexo que contiene el capítulo"),
    number: z.coerce.number().describe("Número del capítulo dentro del anexo"),
}).meta({title: "ReferenciaCapitulo", schemaDescription: "Referencia a un capítulo dentro de un anexo"});

export const ArticleReferenceSchema = z.object({
    referenceType: z.literal("Article"),
    resolution: ResolutionReferenceSchema.optional().nullable().describe("Referencia a la resolución que contiene el artículo; usar si no está en un anexo"),
    annex: AnnexReferenceSchema.optional().nullable().describe("Referencia al anexo que contiene el artículo; usar si no está en la resolución principal"),
    number: z.coerce.number().describe("Número del artículo"),
    suffix: z.string().optional().nullable().describe("Sufijo del artículo, ej. 'bis'; opcional"),
}).refine((data) => {
    return (data.resolution || data.annex) && !(data.resolution && data.annex);
}, {error: "Debe especificar resolución o anexo"}).meta({
    title: "ReferenciaArticulo",
    schemaDescription: "Referencia a un artículo dentro de una resolución o anexo; incluir anexos si aplica. Obligatorio especificar resolución o anexo, aunque sea la actual"
});

export const ReferenceSchema = z.discriminatedUnion("referenceType", [
    ResolutionReferenceSchema,
    AnnexReferenceSchema,
    ChapterReferenceSchema,
    ArticleReferenceSchema,
]).meta({title: "Referencia", schemaDescription: "Referencia a resolución, anexo, capítulo o artículo"});

export const TextReference = z.object({
    before: z.string().describe("Texto antes de la referencia. No más de 5 palabras, salvo que en el mismo artículo haya otra referencia igual"),
    after: z.string().describe("Texto después de la referencia. No más de 5 palabras, salvo que en el mismo artículo haya otra referencia igual"),
    text: z.string().describe("Texto con la referencia"),
    reference: ReferenceSchema.describe("Elemento referenciado"),
}).meta({title: "ReferenciaTexto", schemaDescription: "Referencia dentro de un texto, con contexto antes y después. Solo se puede referenciar a resoluciones de la UNS y su contenido"});
