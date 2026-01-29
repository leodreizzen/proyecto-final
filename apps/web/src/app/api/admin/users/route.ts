import {NextRequest, NextResponse} from "next/server";
import {AdminUsersReturnType} from "@/app/api/admin/users/types";
import {authCheck} from "@/lib/auth/route-authorization";
import {fetchUsers} from "@/lib/data/users";
import {z} from "zod";

const searchParamsSchema = z.object({
    cursor: z.uuid({version: "v7"}).nullable(),
    q: z.string().max(100).nullable(),
});

export async function GET(request: NextRequest):Promise<NextResponse<AdminUsersReturnType>> {
    await authCheck(["ADMIN"]);

    const _cursor = request.nextUrl.searchParams.get("cursor");
    const _q = request.nextUrl.searchParams.get("q");

    const { cursor, q } = searchParamsSchema.parse({
        cursor: _cursor || null,
        q: _q || null
    });

    const users = await fetchUsers(cursor, q);
    return NextResponse.json(users);
}
