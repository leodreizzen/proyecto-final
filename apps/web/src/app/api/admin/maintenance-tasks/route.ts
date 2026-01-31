import { NextRequest, NextResponse } from "next/server";
import { AdminMaintenanceTasksReturnType } from "./types";
import { authCheck } from "@/lib/auth/route-authorization";
import { fetchMaintenanceTasks } from "@/lib/data/maintenance";
import { z } from "zod";

const searchParamsSchema = z.object({
    cursor: z.string().nullable(),
    filter: z.enum(["ALL", "ACTIVE", "COMPLETED", "FAILED"]).default("ALL"),
    q: z.string().max(100).nullable(),
});

export async function GET(
    request: NextRequest
): Promise<NextResponse<AdminMaintenanceTasksReturnType | { error: string }>> {
    await authCheck(["ADMIN"]);

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);

    const parseResult = searchParamsSchema.safeParse({
        cursor: searchParams.cursor || null,
        filter: searchParams.filter,
        q: searchParams.q || null
    });

    if (!parseResult.success) {
        return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const { cursor, filter, q } = parseResult.data;

    try {
        const tasks = await fetchMaintenanceTasks(cursor, filter, q);
        return NextResponse.json(tasks);
    } catch (error) {
        console.error("Error fetching maintenance tasks:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
