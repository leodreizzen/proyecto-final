import prisma from "@/lib/prisma";
import {getRelevantChanges} from "@repo/db/prisma/sql/getRelevantChanges";
import {checkResourcePermission} from "@/lib/auth/data-authorization";


export async function getRelevantChangesList(uuid: string): Promise<{
    id: string,
    date: Date
}[]> {
        await checkResourcePermission("resolution", "read");
        const res = await prisma.$queryRawTyped(getRelevantChanges(uuid));
        return res.filter(r => r.id !== null && r.date !== null).map(r => ({
            id: r.id!,
            date: r.date!
        }));
}