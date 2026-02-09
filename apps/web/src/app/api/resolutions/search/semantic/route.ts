import {NextRequest, NextResponse} from "next/server";
import {searchResolutionsBySemantic} from "@/lib/data/search";
import {z} from "zod";
import {authCheck, publicRoute} from "@/lib/auth/route-authorization";
import {SearchResolutionBySemanticResult} from "@/app/api/resolutions/search/semantic/types";

const ParamsSchema = z.object({
    cursor: z.uuidv7().optional(),
    q: z.string().min(1),
})

export async function GET(request: NextRequest): Promise<NextResponse<SearchResolutionBySemanticResult | { error: string }>> {
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

    const result = await searchResolutionsBySemantic(q, cursor);

    return NextResponse.json(result);
}
