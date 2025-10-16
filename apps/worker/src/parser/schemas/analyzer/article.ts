import {z} from "zod";
import {AnnexReferenceSchema, TextReferenceSchema} from "./reference";
import {ChangeSchema} from "./change";

const ArticleNormative = z.object({
    type: z.literal("Normative").describe("Artículo con disposiciones válidas por sí solas"),
    references: z.array(TextReferenceSchema).describe("Referencias; incluir anexos"),
}).meta({title: "ArticuloNormativa"});

const ArticleCreateDocument = z.object({
    type: z.literal("CreateDocument").describe("Artículo que designa un anexo como documento ordenado"),
    annexToApprove: AnnexReferenceSchema.describe("Referencia a un anexo con nombre a aprobar"),
}).meta({title: "ArticuloCreaDocumento"});

const ArticleModifier = z.object({
    type: z.literal("Modifier").describe("Artículo que realiza cambios en otras resoluciones o artículos"),
    get changes() {
        return ChangeSchema.array().min(1).describe("Lista de cambios aplicables. Debe tener al menos uno");
    }
}).meta({title: "ArticuloModificador"});

const ArticleFormality = z.object({
    type: z.literal("Formality").describe("Artículo de forma, ej. enviar copia a departamentos internos"),
}).meta({title: "ArticuloForma"});

export const ArticleSchema = z.discriminatedUnion("type", [
    ArticleNormative,
    ArticleFormality,
    ArticleModifier,
    ArticleCreateDocument,
]).meta({title: "Articulo"});

export type ArticleAnalysisSchema = z.ZodDiscriminatedUnion<[typeof ArticleNormative, typeof ArticleFormality, typeof ArticleModifier, typeof ArticleCreateDocument], "type">;
export type ArticleAnalysis = z.infer<typeof ArticleSchema>;