import {Resolution} from "@repo/db/prisma/client";

export type resolutionStatus = "ok" | "missingRef" | "inconsistent"
export interface ResolutionWithStatus extends Resolution {
    status: resolutionStatus;
}

export type ResolutionCounts = {
    total: number;
    ok: number;
    missingRef: number;
    inconsistent: number;
}