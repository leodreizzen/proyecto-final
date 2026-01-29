import {NextRequest, NextResponse} from "next/server";
import {AdminUploadHistoryReturnType} from "@/app/api/admin/uploads/history/types";
import {authCheck} from "@/lib/auth/route-authorization";
import {fetchUploadHistory} from "@/lib/data/uploads";
import {z} from "zod";

const searchParamsSchema = z.object({
    cursor: z.string().uuid({version: "v7"}).nullable(),
});

export async function GET(request: NextRequest):Promise<NextResponse<AdminUploadHistoryReturnType>> {
    await authCheck(["ADMIN"]);

    const _cursor = request.nextUrl.searchParams.get("cursor");

    const { cursor } = searchParamsSchema.parse({
        cursor: _cursor || null,
    });

    const history = await fetchUploadHistory(cursor);
    return NextResponse.json(history);
}
