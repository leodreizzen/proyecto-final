import {z} from "zod";
import {llmErrorCodes} from "@/definitions";
import {ResolutionAnalysisSchema} from "@/parser/schemas/analyzer/resolution/resolution";

export const ResolutionAnalysisResultSchema = z.discriminatedUnion("success", [
    z.object({
        success: z.literal(true),
        data: ResolutionAnalysisSchema
    }).meta({title: "AnalisisExitoso"}),
    z.object({
        success: z.literal(false),
        error: z.object({
            code: z.enum(llmErrorCodes),
            message: z.string().describe("Mensaje de error, describiendo por qué no se pudo analizar la resolución")
        }).meta({title: "ErrorAnalisis", schemaDescription: "Error ocurrido durante el análisis de la resolución"})
    }).meta({title: "AnalisisFallido"})
]).meta({
    title: "ResultadoAnalisis",
    schemaDescription: "Resultado del análisis de la resolución, puede ser exitoso o fallido"
});

export type ResolutionAnalysisLLMResult = z.infer<typeof ResolutionAnalysisResultSchema>;
