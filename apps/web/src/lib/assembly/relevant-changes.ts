import prisma from "@/lib/prisma";
import {getRelevantChanges} from "@repo/db/prisma/sql/getRelevantChanges";


export async function getRelevantChangeIds(uuid: string): Promise<string[]> {
    //TODO authckeck
    const res = await prisma.$queryRawTyped(getRelevantChanges(uuid));
    return res.map(r => r.id).filter(id => id !== null);
}