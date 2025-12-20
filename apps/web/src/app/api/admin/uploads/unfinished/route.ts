import {authCheck} from "@/lib/auth/route-authorization";
import {NextResponse} from "next/server";
import {AdminUnfinishedUploadsReturnType} from "@/app/api/admin/uploads/unfinished/types";
import {fetchUnfinishedUploads} from "@/lib/data/uploads";

export async function GET(): Promise<NextResponse<AdminUnfinishedUploadsReturnType>> {
    await authCheck(["ADMIN"]);

    const pendingUploads = await fetchUnfinishedUploads();
    return NextResponse.json(pendingUploads);
}