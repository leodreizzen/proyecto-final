import {ChangeAdvancedSchema, changeOptions} from "@/parser/schemas/analyzer/change";
import {TableStructureSchema} from "@/parser/schemas/structure_parser/table";
import z from "zod";

const filteredOptions = changeOptions.filter(
    (schema): schema is Exclude<typeof changeOptions[number], typeof ChangeAdvancedSchema> =>
        schema !== ChangeAdvancedSchema
);
export const advancedChangeOptions = z.discriminatedUnion("type", filteredOptions as unknown as [typeof filteredOptions[0], ...typeof filteredOptions]);
export const AdvancedChangeResultSchema = z.discriminatedUnion("success", [
    z.object({
        success: z.literal(true),
        changes: z.array(advancedChangeOptions),
        tables: z.array(TableStructureSchema)
    }).meta({title: "AnalisisCambioAvanzadoExitoso"}),
    z.object({
        success: z.literal(false),
        errorType: z.enum(["ALREADY_APPLIED", "CANT_APPLY", "OTHER"]),
        reason: z.string().optional()
    }).meta({title: "AnalisisCambioAvanzadoFallido"})
]).meta({title: "ResultadoAnalisisCambioAvanzado"})

export type AdvancedChangeResult = z.infer<typeof AdvancedChangeResultSchema>;

export const TaskMetadataSchema = z.object({
    completedChanges: z.uuidv7().array(),
    failedChanges: z.uuidv7().array(),
})

export type TaskMetadata = z.infer<typeof TaskMetadataSchema>;