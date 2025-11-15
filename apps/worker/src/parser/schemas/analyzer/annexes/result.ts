import {z} from "zod";
import {AnnexSchema} from "@/parser/schemas/analyzer/annexes/annex";
import {llmErrorCodes} from "@/definitions";

export const AnnexAnalysisResultSchema = z.discriminatedUnion("success", [
    z.object({
        success: z.literal(true),
        data: AnnexSchema
    }).meta({title: "AnalisisExitoso"}),
    z.object({
        success: z.literal(false),
        error: z.object({
            code: z.enum(llmErrorCodes),
            message: z.string().describe("Mensaje de error, describiendo por qué no se pudo analizar la resolución")
        }).meta({title: "ErrorAnalisis", schemaDescription: "Error ocurrido durante el análisis de la resolución"})
    }).meta({title: "AnalisisFallido"})
]).meta({
    title: "ResultadoAnalisisAnexo",
    schemaDescription: "Resultado del análisis de un anexo de la resolución, puede ser exitoso o fallido"
});