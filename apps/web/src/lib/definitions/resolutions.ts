import {Resolution} from "@repo/db/prisma/client";

export type resolutionStatus = "ok" | "missingRef" | "inconsistent"
export interface ResolutionWithStatus extends Resolution {
    status: resolutionStatus;
}