import prisma from "@repo/db/prisma";
import {processAdvancedChange} from "@/maintenance_tasks/advanced_changes/processing";
import * as util from "node:util";

const args = process.argv.slice(2);
const changeId = args[0];
if (!changeId) {
    console.error("Please provide a change ID as the first argument.");
    process.exit(1);
}

async function analyzeAdvancedChanges(changeId: string) {
    const targetResIdQueryRes = await prisma.changeAdvanced.findUnique({
        where: {
            id: changeId,
        },
        select: {
            target: {
                select: {
                    resolved: {
                        select: {
                            res_init: true,
                            res_num: true,
                            res_year: true
                        }
                    }
                }
            }
        }
    });

    if (!targetResIdQueryRes) {
        throw new Error(`Advanced change with ID ${changeId} not found.`);
    }
    if (!targetResIdQueryRes.target.resolved) {
        throw new Error(`Target resolution for advanced change ID ${changeId} not found.`);
    }

    const resolution = await prisma.resolution.findUnique({
        where: {
            initial_number_year: {
                initial: targetResIdQueryRes.target.resolved.res_init,
                number: targetResIdQueryRes.target.resolved.res_num,
                year: targetResIdQueryRes.target.resolved.res_year
            }
        }
    })

    const res = await processAdvancedChange(changeId, resolution!.id);
    console.log(util.inspect(res, {depth: 0, colors: true}))
}


analyzeAdvancedChanges(changeId).catch(console.error);