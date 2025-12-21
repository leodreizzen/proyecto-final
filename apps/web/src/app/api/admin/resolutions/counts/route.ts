import {NextResponse} from "next/server";
import {authCheck} from "@/lib/auth/route-authorization";
import {countResolutions} from "@/lib/data/resolutions";
import {AdminResolutionsCountsReturnType} from "@/app/api/admin/resolutions/counts/types";

export async function GET():Promise<NextResponse<AdminResolutionsCountsReturnType>> {
    //TODO pagination
    await authCheck(["ADMIN"]);

    const resolutions = await countResolutions()
    return NextResponse.json(resolutions);
}