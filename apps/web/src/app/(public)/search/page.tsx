import { authCheck, publicRoute } from "@/lib/auth/route-authorization";
import { SearchWidget } from "@/components/home/search-widget";
import {searchResolutionsById, searchResolutionsByKeyword, searchResolutionsBySemantic} from "@/lib/data/search";
import { SearchResults } from "./search-results";
import { SearchSummary } from "@/components/search/search-summary";
import { z } from "zod";
import { redirect } from "next/navigation";
import { Metadata } from "next";

type SearchPageProps = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const SearchByIdParamsSchema = z.object({
    search_type: z.literal('by_id'),
    initial: z.string().optional(),
    number: z.coerce.number().optional(),
    year: z.coerce.number().optional(),
});

const SearchBySemanticParamsSchema = z.object({
    search_type: z.literal('semantic'),
    q: z.string()
});

const SearchByKeywordParamsSchema = z.object({
    search_type: z.literal('keywords'),
    q: z.string()
});

const SearchParamsSchema = z.discriminatedUnion('search_type', [
    SearchByIdParamsSchema,
    SearchBySemanticParamsSchema,
    SearchByKeywordParamsSchema
]);

export const metadata: Metadata = {
    title: "Búsqueda"
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    await authCheck(publicRoute);

    const params = await searchParams;


    const parseRes = SearchParamsSchema.safeParse(params);

    if (!parseRes.success) {
        console.error("Error parsing search");
        redirect("/");
    }

    const { data } = parseRes;

    let initialResult;
    if (data.search_type === 'by_id') {
        initialResult = await searchResolutionsById(data, undefined);
    } else if (data.search_type === 'semantic') {
        initialResult = await searchResolutionsBySemantic(data.q, undefined);
    } else if (data.search_type === 'keywords') {
        initialResult = await searchResolutionsByKeyword(data.q, undefined);
    } else {
        const _exhaustiveCheck: never = data;
        console.error("Invalid search type");
        redirect("/");
    }

    const widgetInitialValues = {
        initial: data.search_type === 'by_id' ? data.initial : undefined,
        number: data.search_type === 'by_id' && data.number ? data.number.toString() : undefined,
        year: data.search_type === 'by_id' && data.year ? data.year.toString() : undefined,
        query: (data.search_type === 'semantic' || data.search_type === 'keywords') ? data.q : undefined,
        activeTab: data.search_type === 'by_id' ? 'id' : data.search_type
    }


    return (
        <div className="mx-4 md:mx-14 space-y-8 my-10">
            {/* Unified Search Panel */}
            <div
                className="w-full mb-10 md:mb-20 xl:max-w-240 container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="sm:bg-card sm:border rounded-3xl shadow-sm overflow-hidden ">
                    <div className="p-0 sm:p-4 md:p-8 space-y-6">
                        <div className="flex justify-center gap-3 text-primary">
                            <h1 className="text-2xl font-bold font-serif text-foreground text-center">Búsqueda de
                                Resoluciones</h1>
                        </div>

                        <div className="w-full">
                            <SearchWidget
                                initialValues={widgetInitialValues}
                            />
                        </div>
                    </div>

                    {/* Summary Footer inside the card */}
                    <div
                        className="sm:bg-muted/30 px-6 md:px-8 py-4 sm:border-t flex items-center justify-center md:justify-start">
                        <SearchSummary filters={data} count={initialResult.meta.total} />
                    </div>
                </div>
            </div>

            {/* Results Area */}
            <div className="w-full container mx-auto px-4 sm:px-6 lg:px-8">
                <SearchResults initialData={initialResult} filters={data} />
            </div>
        </div>
    );
}
