import { TransactionPrismaClient } from "@repo/db/prisma";
import { processAdvancedChange } from "@/maintenance_tasks/advanced_changes/processing";
import { changeCreationInput } from "@/data/save-resolution/changes";
import { ChangeAdvancedResolveResult } from "@repo/db/prisma/enums";

export async function saveAdvancedChangeResult(changeId: string, result: Awaited<ReturnType<typeof processAdvancedChange>>, tx: TransactionPrismaClient) {
    const advancedChange = await tx.changeAdvanced.findUnique({
        select: {
            change: {
                select: {
                    articleModifier: {
                        select: {
                            id: true,
                        },
                    }
                }
            },
            resolvedChanges: {
                select: {
                    id: true,
                }
            }
        },
        where: {
            id: changeId,
        }
    });
    if (!advancedChange) {
        throw new Error(`Advanced change with ID ${changeId} not found when saving result.`);
    }

    await tx.change.deleteMany({
        where: {
            id: {
                in: advancedChange.resolvedChanges.map(c => c.id)
            }
        }
    })

    let resolveResult: ChangeAdvancedResolveResult;
    if (result.success) {
        resolveResult = "CORRECT";
    } else {
        if (result.errorType === "ALREADY_APPLIED") {
            resolveResult = "ALREADY_APPLIED";
        } else if (result.errorType === "CANT_APPLY") {
            resolveResult = "INAPPLICABLE";
        } else {
            throw new Error("Advanced change analysis unknown error: " + JSON.stringify(result, null, 2));
        }
    }

    await tx.changeAdvanced.update({
        where: {
            id: changeId,
        },
        data: {
            resolvedChanges: result.success ? {
                create: result.changes.map(change => ({
                    ...changeCreationInput(change),
                    articleModifier: {
                        connect: {
                            id: advancedChange.change.articleModifier.id,
                        }
                    }
                }))
            } : undefined,
            resolveResult: resolveResult,
            resolvedAt: new Date(),
            resolvedHash: result.resolvedHash,
            modelVersion: result.modelVersion
        }
    });
}