import {NextRequest, NextResponse} from "next/server";
import {AdminMissingResolutionsReturnType} from "@/app/api/admin/missing-resolutions/types";
import {authCheck} from "@/lib/auth/route-authorization";
import {fetchMissingResolutions} from "@/lib/data/resolutions";
import {z} from "zod";
import {slugToResID} from "@/lib/paths";

const searchParamsSchema = z.object({
    cursor: z.string().nullable(),
    q: z.string().max(100).nullable(),
});

export async function GET(request: NextRequest):Promise<NextResponse<AdminMissingResolutionsReturnType | {error: string}>> {
    await authCheck(["ADMIN"]);

    const _cursor = request.nextUrl.searchParams.get("cursor");
    const _q = request.nextUrl.searchParams.get("q");

    const { cursor: cursorSlug, q } = searchParamsSchema.parse({
        cursor: _cursor || null,
        q: _q || null
    });

    const cursor = cursorSlug ? slugToResID(cursorSlug) : null;
    if (cursorSlug && !cursor) {
        return NextResponse.json({error: "Invalid cursor parameter"}, {status: 400});
    }

    const resolutions = await fetchMissingResolutions(cursor, q)
    return NextResponse.json(resolutions);
}
