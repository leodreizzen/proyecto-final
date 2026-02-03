import {findMaintenanceTask} from "@/data/queries";
import {
    updateMaintenanceTaskStatus,
    upsertAdvancedChangesTask,
    upsertEmbeddingsTask
} from "@repo/jobs/maintenance/mutations";
import prisma, {TransactionPrismaClient} from "@repo/db/prisma";
import {getAffectedResolutions} from "@repo/db/prisma/sql/getAffectedResolutions";
import {scheduleAdvancedChangesTask, scheduleEmbeddingsTask} from "@repo/jobs/maintenance/queue";
import {publishMaintenanceTaskUpdate, publishNewMaintenanceTasks} from "@repo/pubsub/publish/maintenance_tasks";
import {filterResolutionsImpactedByAdvancedChanges} from "@/data/advanced_changes/filter";

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
    } catch (error) {
        console.log(`Impact evaluation for maintenance task ${jobId} failed:`, error);
        await updateMaintenanceTaskStatus({taskId: jobId, status: "FAILED", errorMessage: "Error interno"});
        jobsToCreate = null;
    }

    if (jobsToCreate !== null) {
        for (const task of jobsToCreate.advancedChangesTasks) {
            await scheduleAdvancedChangesTask(task.id, task.resolutionId, task.depth);
        }
        for (const task of jobsToCreate.embeddingTasks) {
            await scheduleEmbeddingsTask(task.id, task.resolutionId, task.depth);
        }
        const allNewTaskIds = [
            ...jobsToCreate.advancedChangesTasks.map(t => t.id),
            ...jobsToCreate.embeddingTasks.map(t => t.id)
        ];
        await publishNewMaintenanceTasks(allNewTaskIds);
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


