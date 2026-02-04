import z from "zod";

export const CutoffSchema = z.object({
    date: z.coerce.date(),
    resolutionId: z.string().uuid()
});

export const EvaluateImpactPayloadSchema = z.object({
    cutoff: CutoffSchema.optional()
});

export type EvaluateImpactPayload = z.infer<typeof EvaluateImpactPayloadSchema>;
