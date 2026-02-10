import z from "zod";

export const CutoffSchema = z.object({
    date: z.coerce.date(),
    resolutionId: z.string().uuid()
});

export const EvaluateImpactPayloadSchema = z.object({
    cutoff: CutoffSchema.optional()
});

export type EvaluateImpactPayload = z.infer<typeof EvaluateImpactPayloadSchema>;

export const TaskMetadataSchema = z.object({
    completedChanges: z.uuidv7().array(),
    failedChanges: z.uuidv7().array(),
})

export type TaskMetadata = z.infer<typeof TaskMetadataSchema>;


