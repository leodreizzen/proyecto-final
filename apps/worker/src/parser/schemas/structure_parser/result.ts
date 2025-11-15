import z from "zod";
import {llmErrorCodes} from "@/definitions";
import {ResolutionStructureSchema} from "@/parser/schemas/structure_parser/schemas";

export const ResolutionStructureResultSchema = z.discriminatedUnion("success", [
    z.object({
        success: z.literal(true),
        data: ResolutionStructureSchema
    }).meta({title: "ParseoExitoso"}),
    z.object({
        success: z.literal(false),
        error: z.object({
            code: z.enum(llmErrorCodes),
            message: z.string().describe("Mensaje de error, describiendo por qué no se pudo parsear la resolución")
        }).meta({title: "ErrorParseo", schemaDescription: "Error ocurrido durante el parseo de la resolución"})
    }).meta({title: "ParseoFallido"})
]).meta({
    title: "ResultadoParseo",
    schemaDescription: "Resultado del parseo de la resolución, puede ser exitoso o fallido"
});

export type ResolutionStructureLLMResult = z.infer<typeof ResolutionStructureResultSchema>;
