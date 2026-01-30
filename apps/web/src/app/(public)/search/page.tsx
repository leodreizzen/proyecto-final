import {authCheck, publicRoute} from "@/lib/auth/route-authorization";
import {SearchWidget} from "@/components/home/search-widget";
import {searchResolutions} from "@/lib/data/search";
import {SearchResults} from "./search-results";
import {SearchSummary} from "@/components/search/search-summary";
import {z} from "zod";
import {redirect} from "next/navigation";

type SearchPageProps = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const SearchByIdParamsSchema = z.object({
    search_type: z.literal('by_id'),
    initial: z.string().optional(),
    number: z.coerce.number().optional(),
    year: z.coerce.number().optional(),
})

export default async function SearchPage({searchParams}: SearchPageProps) {
    await authCheck(publicRoute);

    const params = await searchParams;


    const parseRes = SearchByIdParamsSchema.safeParse(params);

    if (!parseRes.success) {
        console.error("Error parsing search");
        redirect("/");
    }

    const filters = {
        initial: parseRes.data.initial,
        number: parseRes.data.number,
        year: parseRes.data.year,
    };

    const initialResult = await searchResolutions(filters, undefined);

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
                                initialValues={{
                                    initial: filters.initial,
                                    number: filters.number?.toString(),
                                    year: filters.year?.toString()
                                }}
                            />
                        </div>
                    </div>

                    {/* Summary Footer inside the card */}
                    <div
                        className="sm:bg-muted/30 px-6 md:px-8 py-4 sm:border-t flex items-center justify-center md:justify-start">
                        <SearchSummary filters={filters} count={initialResult.meta.total}/>
                    </div>
                </div>
            </div>

            {/* Results Area */}
            <div className="w-full container mx-auto px-4 sm:px-6 lg:px-8">
                <SearchResults initialData={initialResult} filters={filters}/>
            </div>
        </div>
    );
}
