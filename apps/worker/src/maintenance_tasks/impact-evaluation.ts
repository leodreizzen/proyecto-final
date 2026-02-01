import {findMaintenanceTask} from "@/data/queries";
import {
    updateMaintenanceTaskStatus,
    upsertAdvancedChangesTask,
    upsertEmbeddingsTask
} from "@repo/jobs/maintenance/mutations";
import prisma, {TransactionPrismaClient} from "@repo/db/prisma";
import {getAffectedResolutions} from "@repo/db/prisma/sql/getAffectedResolutions";
import {scheduleAdvancedChangesTask, scheduleEmbeddingsTask} from "@repo/jobs/maintenance/queue";
import {publishMaintenanceTaskUpdate, publishNewMaintenanceTask} from "@repo/pubsub/publish/maintenance_tasks";

export async function processEvaluateImpactJob(jobId: string) {
    console.log(`Starting impact evaluation for maintenance task ${jobId}`);
    const task = await findMaintenanceTask(jobId);
    if (!task) {
        throw new Error(`Maintenance task with ID ${jobId} not found`);
    }
    let jobsToCreate: Awaited<ReturnType<typeof createTasksForImpactedResolutions>> | null = null;
    try {
        await updateMaintenanceTaskStatus({taskId: jobId, status: "PROCESSING"});
        await publishMaintenanceTaskUpdate(jobId, ["status"]);
        jobsToCreate = await prisma.$transaction(async (tx) => {
            const impacted = await getImpactedResolutions(task.resolutionId, tx);
            const createRes = await createTasksForImpactedResolutions(task.resolutionId, task.triggerEventId, impacted);
            await updateMaintenanceTaskStatus({
                taskId: jobId,
                status: "COMPLETED",
                tx,
                ifStatus: ["PENDING", "PROCESSING"]
            });
            return createRes;
        });
    } catch {
        await updateMaintenanceTaskStatus({taskId: jobId, status: "FAILED", errorMessage: "Error interno"});
        jobsToCreate = null;
    }

    if (jobsToCreate !== null) {
        for (const task of jobsToCreate.advancedChangesTasks) {
            await scheduleAdvancedChangesTask(task.id, task.resolutionId, task.depth);
            await publishNewMaintenanceTask(task.id);
        }
        for (const task of jobsToCreate.embeddingTasks) {
            await scheduleEmbeddingsTask(task.id, task.resolutionId, task.depth);
            await publishNewMaintenanceTask(task.id);
        }
    }
    await publishMaintenanceTaskUpdate(jobId, ["status"]); // either COMPLETED or FAILED
}

async function getImpactedResolutions(resolutionId: string, tx: TransactionPrismaClient = prisma) {
    const changes = await tx.change.findMany({
        where: {
            articleModifier: {
                article: {
                    context: {
                        rootResolutionId: resolutionId
                    }
                }
            }
        }, select: {
            id: true
        }
    });
    const changeIds = changes.map(c => c.id);


    const queryRes = await prisma.$queryRawTyped(getAffectedResolutions(changeIds));
    const impactedResolutionIdsWithDepth = queryRes.filter(r => r.id !== null && r.id !== resolutionId).map(r => ({
        id: r.id!,
        depth: r.min_impact_depth !== null ? r.min_impact_depth + 1 : 1
    }));

    impactedResolutionIdsWithDepth.push({
        id: resolutionId,
        depth: 0
    })

    return impactedResolutionIdsWithDepth;
}

async function createTasksForImpactedResolutions(resolutionId: string, eventId: string, impactedWithDepth: {
    id: string,
    depth: number
}[], tx: TransactionPrismaClient = prisma) {
    const impactedResolutionIds = impactedWithDepth.map(r => r.id);
    const embeddingTasks = [];
    const advancedChangesTasks = [];
    const filtered = await filterResolutionsImpactedByAdvancedChanges(impactedResolutionIds, [...impactedResolutionIds, resolutionId], tx);
    for (const {id: impactedId, depth} of impactedWithDepth) {
        const embeddingTask = await upsertEmbeddingsTask(impactedId, eventId, depth, tx);
        if (embeddingTask.created) {
            embeddingTasks.push({id: embeddingTask.id, resolutionId: impactedId, depth});
        }

        if (filtered.has(impactedId)) {
            const advancedChangesTask = await upsertAdvancedChangesTask(impactedId, eventId, depth, tx);
            if (advancedChangesTask.created)
                advancedChangesTasks.push({id: advancedChangesTask.id, resolutionId: impactedId, depth});
        }
    }
    return {embeddingTasks: embeddingTasks, advancedChangesTasks: advancedChangesTasks};
}


async function filterResolutionsImpactedByAdvancedChanges(resolutions: string[], by_res: string[], tx: TransactionPrismaClient = prisma): Promise<Map<string, string[]>> {
    const resIds = await tx.resolution.findMany({
        where: {
            id: {in: resolutions},
        },
        select: {
            initial: true,
            number: true,
            year: true
        }
    });
    const filtered = await tx.changeAdvanced.findMany({
        where: {
            target: {
                resolved: {
                    OR: resIds.map(r => ({
                        res_init: r.initial,
                        res_num: r.number,
                        res_year: r.year
                    }))
                }
            },
            change: {
                articleModifier: {
                    article: {
                        context: {
                            rootResolutionId: {in: by_res}
                        }
                    }
                }
            }
        },
        select: {
            id: true,
            change: {
                select: {
                    articleModifier: {
                        select: {
                            article: {
                                select: {
                                    context: {
                                        select: {
                                            rootResolutionId: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    const changesMap = new Map<string, string[]>();
    for (const change of filtered) {
        const rootResId = change.change.articleModifier.article.context?.rootResolutionId;
        if (!rootResId) continue;
        if (!changesMap.has(rootResId)) {
            changesMap.set(rootResId, []);
        }
        changesMap.get(rootResId)!.push(change.id);
    }
    return changesMap;
}
