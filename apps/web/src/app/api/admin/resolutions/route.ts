import {NextRequest, NextResponse} from "next/server";
import {AdminResolutionsReturnType} from "@/app/api/admin/resolutions/types";
import {authCheck} from "@/lib/auth/route-authorization";
import {fetchResolutionsWithStatus} from "@/lib/data/resolutions";
import {z} from "zod";

const searchParamsSchema = z.object({
    cursor: z.uuid({version: "v7"}).nullable(),
    q: z.string().max(100).nullable(),
});

export async function GET(request: NextRequest):Promise<NextResponse<AdminResolutionsReturnType>> {
    await authCheck(["ADMIN"]);

    const _cursor = request.nextUrl.searchParams.get("cursor");
    const _q = request.nextUrl.searchParams.get("q");

    const { cursor, q } = searchParamsSchema.parse({
        cursor: _cursor || null,
        q: _q || null
    });

    const resolutions = await fetchResolutionsWithStatus(cursor, q)
    return NextResponse.json(resolutions);
}