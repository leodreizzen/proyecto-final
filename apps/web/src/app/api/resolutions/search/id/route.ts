import {NextRequest, NextResponse} from "next/server";
import {searchResolutionsById} from "@/lib/data/search";
import {z} from "zod";
import {authCheck, publicRoute} from "@/lib/auth/route-authorization";
import {SearchResolutionByIdResult} from "@/app/api/resolutions/search/id/types";

const ParamsSchema = z.object({
    cursor: z.uuidv7().optional(),
    initial: z.string().optional(),
    number: z.coerce.number().optional(),
    year: z.coerce.number().optional(),
})

export async function GET(request: NextRequest): Promise<NextResponse<SearchResolutionByIdResult | { error: string }>> {
    await authCheck(publicRoute);

    const searchParams = request.nextUrl.searchParams;

    const parseRes = ParamsSchema.safeParse({
        cursor: searchParams.get("cursor") || undefined,
        initial: searchParams.get("initial") || undefined,
        number: searchParams.get("number") ?? undefined,
        year: searchParams.get("year") ?? undefined,
    });

    if (!parseRes.success) {
        return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }

    const { cursor, initial, number, year } = parseRes.data;

    const result = await searchResolutionsById({ search_type: "by_id", initial, number, year }, cursor);

    return NextResponse.json(result);
}
