import {findMaintenanceTask} from "@/data/queries";
import {TaskMetadata, TaskMetadataSchema} from "@/maintenance_tasks/advanced_changes/schemas";
import {filterResolutionsImpactedByAdvancedChanges} from "@/data/advanced_changes/filter";
import {processAdvancedChange} from "@/maintenance_tasks/advanced_changes/processing";
import prisma from "@repo/db/prisma";
import {saveAdvancedChangeResult} from "@/data/advanced_changes/save-result";
import {updateMaintenanceTaskMetadata, updateMaintenanceTaskStatus} from "@repo/jobs/maintenance/mutations";
import {MaintenanceTaskStatus} from "@repo/db/prisma/enums";

export async function processAdvancedChangesJob(jobId: string) {
    console.log(`Starting advanced changes analysis for maintenance task ${jobId}`);

    // to prevent race conditions, always refetch after finishing, to see if there are more changes to process
    for (let loopCount = 0; loopCount < 13; loopCount++) { // limit to 12 iterations to prevent llm api loop in case of a bug
        const initRes = await prisma.$transaction(async (tx) => {
            const task = await findMaintenanceTask(jobId, tx);
            if (!task) {
                throw new Error(`Maintenance task with ID ${jobId} not found`);
            }
            if (task.type !== "PROCESS_ADVANCED_CHANGES") {
                throw new Error(`Maintenance task with ID ${jobId} is not of type ADVANCED_CHANGES_ANALYSIS`);
            }

            await updateMaintenanceTaskStatus({
                taskId: jobId,
                status: "PROCESSING",
            }) // outside transaction

            const metadataParseRes = TaskMetadataSchema.safeParse(task.payload);
            let metadata: TaskMetadata;
            if (!metadataParseRes.success) {
                metadata = {
                    completedChanges: [],
                    failedChanges: [],
                };
            } else {
                metadata = metadataParseRes.data;
            }

            const changesMap = await filterResolutionsImpactedByAdvancedChanges([task.resolutionId], null, tx);
            const changesToProcess = changesMap.get(task.resolutionId);

            let done = false;
            let changesPending;
            if (!changesToProcess || changesToProcess.length === 0) {
                done = true;
                console.log("No advanced changes to process.");
            }
            else {
                changesPending = changesToProcess.filter(c =>
                    !metadata.completedChanges.includes(c) && !metadata.failedChanges.includes(c)
                );
                if (changesPending.length === 0) {
                    console.log("No more pending advanced changes to process.");
                    done = true;
                }
            }

            if (done) {
                let status: MaintenanceTaskStatus;
                if (metadata.failedChanges.length === 0) {
                    status = "COMPLETED";
                } else if (metadata.completedChanges.length === 0) {
                    status = "FAILED";
                } else {
                    status = "PARTIAL_FAILURE";
                }

                await updateMaintenanceTaskStatus({
                    taskId: jobId,
                    ...(status === "FAILED" ? {status, errorMessage: "Error interno"} : {status}),
                    tx
                })

                return {done: true as const}
            }
            return {done: false as const, changesPending: changesPending!, task, metadata};
        })

        if (initRes.done) {
            return;
        }
        const {changesPending, task, metadata} = initRes;

        for (const changeId of changesPending) {
            try {
                const res = await processAdvancedChange(changeId, task.resolutionId);
                await prisma.$transaction(async (tx) => {
                    await saveAdvancedChangeResult(changeId, res, tx);
                    // TODO create impact task. But we need to fix the date problem first
                    metadata.completedChanges.push(changeId);
                })

                console.log(`Processing advanced change ${changeId} for maintenance task ${jobId}`);
            } catch (e) {
                console.error(`Error processing advanced change ${changeId} for maintenance task ${jobId}:`, e);
                metadata.failedChanges.push(changeId);
            }
            await updateMaintenanceTaskMetadata({taskId: jobId, metadata})
        }
    }

    console.log(`Advanced changes analysis for maintenance task ${jobId} reached maximum iterations.`);
    await updateMaintenanceTaskStatus({
        taskId: jobId,
        status: "PARTIAL_FAILURE",
    });
}