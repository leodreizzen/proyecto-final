import prisma from "@repo/db/prisma";
import {getRelevantChanges} from "@repo/db/prisma/sql/getRelevantChanges";


export async function getRelevantChangesList(uuid: string): Promise<{
    id: string,
    date: Date
}[]> {
        const res = await prisma.$queryRawTyped(getRelevantChanges(uuid));
        return res.filter(r => r.id !== null && r.date !== null).map(r => ({
            id: r.id!,
            date: r.date!
        }));
}