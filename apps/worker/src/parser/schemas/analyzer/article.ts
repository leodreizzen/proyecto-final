import {z} from "zod";
import {AnnexReferenceSchema} from "./reference";
import {ChangeSchema} from "./change";

const ArticleNormative = z.object({
    type: z.literal("Normative").describe("Artículo con disposiciones válidas por sí solas. NO modifica otras resoluciones o artículos"),
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

export type ArticleModifier = z.infer<typeof ArticleModifier>;

const ArticleFormality = z.object({
    type: z.literal("Formality").describe("Artículo de forma, ej. enviar copia a departamentos internos"),
}).meta({title: "ArticuloForma"});

export const ArticleSchema = z.discriminatedUnion("type", [
    ArticleNormative,
    ArticleFormality,
    ArticleModifier,
    ArticleCreateDocument,
]).meta({title: "Articulo"});

export const ArticleSchemaWithText = z.object({
    text: z.string().describe("Texto completo del artículo"),
    get analysis(): ArticleAnalysisSchema {
        return ArticleSchema.describe("Análisis del artículo a agregar")
    }
}).meta({title: "ArticuloConTexto"});

export type ArticleSchemaWithText = z.infer<typeof ArticleSchemaWithText>;

export type ArticleAnalysisSchema = z.ZodDiscriminatedUnion<[typeof ArticleNormative, typeof ArticleFormality, typeof ArticleModifier, typeof ArticleCreateDocument], "type">;
export type ArticleAnalysis = z.infer<typeof ArticleSchema>;