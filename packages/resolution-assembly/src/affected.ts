import prisma, {TransactionPrismaClient} from "@repo/db/prisma";
import {getResolutionsDirectlyAffectedByRes} from "@repo/db/prisma/sql/getResolutionsDirectlyAffectedByRes";

export async function getDirectlyAffectedResolutionIds(resolutionId: string, tx: TransactionPrismaClient = prisma): Promise<string[]> {
    const sqlRes = await tx.$queryRawTyped(getResolutionsDirectlyAffectedByRes(resolutionId))
    return sqlRes.filter(r => r.affected_resolution_id !== null && r.affected_resolution_id !== resolutionId).map(r => r.affected_resolution_id)
}