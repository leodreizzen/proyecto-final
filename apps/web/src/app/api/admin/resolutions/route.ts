import {NextResponse} from "next/server";
import {AdminResolutionsReturnType} from "@/app/api/admin/resolutions/types";
import {authCheck} from "@/lib/auth/route-authorization";
import {fetchResolutionsWithStatus} from "@/lib/data/resolutions";

export async function GET():Promise<NextResponse<AdminResolutionsReturnType>> {
    //TODO pagination
    await authCheck(["ADMIN"]);

    const resolutions = await fetchResolutionsWithStatus()
    return NextResponse.json(resolutions);
}