import {z} from "zod";
import {ChangeSchema} from "./change";
import {AnnexReferenceSchema} from "@/parser/schemas/references/schemas";

const ArticleNormativeSchema = z.object({
    type: z.literal("Normative").describe("Artículo con disposiciones válidas por sí solas. NO modifica otras resoluciones o artículos"),
}).meta({title: "ArticuloNormativa"});

const ArticleCreateDocumentSchema = z.object({
    type: z.literal("CreateDocument").describe("Artículo que designa un anexo como documento ordenado"),
    annexToApprove: AnnexReferenceSchema.describe("Referencia a un anexo con nombre a aprobar"),
}).meta({title: "ArticuloCreaDocumento"});

const ArticleModifierSchema = z.object({
    type: z.literal("Modifier").describe("Artículo que realiza cambios en otras resoluciones o artículos"),
    get changes() {
        return ChangeSchema.array().min(1).describe("Lista de cambios aplicables. Debe tener al menos uno");
    }
}).meta({title: "ArticuloModificador"});

export type ArticleModifier = z.infer<typeof ArticleModifierSchema>;

const ArticleFormalitySchema = z.object({
    type: z.literal("Formality").describe("Artículo de forma, ej. enviar copia a departamentos internos"),
}).meta({title: "ArticuloForma"});

export const ArticleSchema = z.discriminatedUnion("type", [
    ArticleNormativeSchema,
    ArticleFormalitySchema,
    ArticleModifierSchema,
    ArticleCreateDocumentSchema,
]).meta({title: "Articulo"});

export const ArticleSchemaWithText = z.object({
    text: z.string().describe("Texto completo del artículo"),
    get analysis(): ArticleAnalysisSchema {
        return ArticleSchema.describe("Análisis del artículo a agregar")
    }
}).meta({title: "ArticuloConTexto"});

export type NewAnalyzedArticle = z.infer<typeof ArticleSchemaWithText>;

export type ArticleAnalysisSchema = z.ZodDiscriminatedUnion<[typeof ArticleNormativeSchema, typeof ArticleFormalitySchema, typeof ArticleModifierSchema, typeof ArticleCreateDocumentSchema], "type">;
export type ArticleAnalysis = z.infer<typeof ArticleSchema>;