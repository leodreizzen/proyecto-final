import {NextRequest, NextResponse} from "next/server";
import {AdminResolutionsReturnType} from "@/app/api/admin/resolutions/types";
import {authCheck} from "@/lib/auth/route-authorization";
import {fetchResolutionsWithStatus} from "@/lib/data/resolutions";
import {z} from "zod";

const cursorSchema = z.uuid({version: "v7"});
export async function GET(request: NextRequest):Promise<NextResponse<AdminResolutionsReturnType>> {
    await authCheck(["ADMIN"]);

    const _cursor = request.nextUrl.searchParams.get("cursor");
    let cursor = null;
    if (_cursor && _cursor.trim().length > 0) {
        cursor = cursorSchema.parse(_cursor);
    }

    const resolutions = await fetchResolutionsWithStatus(cursor)
    return NextResponse.json(resolutions);
}