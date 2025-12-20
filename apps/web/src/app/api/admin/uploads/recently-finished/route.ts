import {authCheck} from "@/lib/auth/route-authorization";
import {NextResponse} from "next/server";
import {fetchRecentFinishedUploads} from "@/lib/data/uploads";
import {AdminRecentlyFinishedUploadsReturnType} from "@/app/api/admin/uploads/recently-finished/types";

export async function GET(): Promise<NextResponse<AdminRecentlyFinishedUploadsReturnType>> {
    await authCheck(["ADMIN"]);

    const pendingUploads = await fetchRecentFinishedUploads();
    return NextResponse.json(pendingUploads);
}