import {NextRequest, NextResponse} from "next/server";
import {searchResolutionsByKeyword} from "@/lib/data/search";
import {z} from "zod";
import {authCheck, publicRoute} from "@/lib/auth/route-authorization";
import {SearchResolutionByKeywordsResult} from "@/app/api/resolutions/search/keywords/types";

const ParamsSchema = z.object({
    cursor: z.uuidv7().optional(),
    q: z.string().min(1),
})

export async function GET(request: NextRequest): Promise<NextResponse<SearchResolutionByKeywordsResult | { error: string }>> {
    await authCheck(publicRoute);

    const searchParams = request.nextUrl.searchParams;

    const parseRes = ParamsSchema.safeParse({
        cursor: searchParams.get("cursor") || undefined,
        q: searchParams.get("q") || "",
    });

    if (!parseRes.success) {
        return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }

    const { cursor, q } = parseRes.data;

    const result = await searchResolutionsByKeyword(q, cursor);

    return NextResponse.json(result);
}
