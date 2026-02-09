import prisma from "@/lib/prisma";
import {Prisma} from "@repo/db/prisma/client";
import {checkResourcePermission} from "@/lib/auth/data-authorization";
import {createOpenaiEmbedding} from "@repo/ai/openai_wrapper";
import {EMBEDDINGS_DIMENSIONS, EMBEDDINGS_MODEL} from "@repo/ai/embeddings";
import {semanticSearch} from "@repo/db/prisma/sql/semanticSearch";
import {keywordSearch} from "@repo/db/prisma/sql/keywordSearch";
import {keywordSearchResolutions} from "@repo/db/prisma/sql/keywordSearchResolutions";
import {semanticSearchResolutions} from "@repo/db/prisma/sql/semanticSearchResolutions";
import {SearchResolutionQueryResult} from "@/app/api/resolutions/search/types";


export type SearchFilters = {
    search_type: 'by_id',
    initial?: string,
    number?: number,
    year?: number,
} | {
    search_type: 'semantic',
    q: string
} | {
    search_type: 'keywords',
    q: string
}

const PAGE_SIZE = 12; // multiple of 3 and 2 for grid layouts


export async function searchResolutionsById(filters: SearchFilters & {search_type: "by_id"}, cursor?: string): Promise<SearchResolutionQueryResult> {
    await checkResourcePermission("resolution", "read");
    const where: Prisma.ResolutionWhereInput = {};

    if (filters.initial) {
        where.initial = {equals: filters.initial, mode: "insensitive"};
    }

    if (filters.number) {
        where.number = filters.number;
    }

    if (filters.year) {
        where.year = filters.year;
    }

    const [count, data] = await prisma.$transaction([
        prisma.resolution.count({where}),
        prisma.resolution.findMany({
            where,
            orderBy: [
                {date: 'desc'},
                {number: 'desc'}
            ],
            take: PAGE_SIZE,
            skip: cursor ? 1 : 0,
            cursor: cursor ? {id: cursor} : undefined,
            select: {
                id: true,
                initial: true,
                number: true,
                year: true,
                date: true,
                summary: true,
                title: true,
            }
        })
    ]);

    const lastItem = data[data.length - 1];
    const nextCursor = (data.length === PAGE_SIZE && lastItem) ? lastItem.id : undefined;

    return {
        data: data.map(res => ({
            ...res,
            date: res.date,
        })),
        meta: {
            total: count,
            nextCursor,
            pageSize: PAGE_SIZE
        }
    };
}

export async function searchResolutionsByKeyword(keywords: string, cursor?: string): Promise<SearchResolutionQueryResult> {
    await checkResourcePermission("resolution", "read");

    const results = await prisma.$queryRawTyped(keywordSearchResolutions(keywords, cursor ?? null, PAGE_SIZE));

    const contentIds = results.map(r => r.resolutionID);

    const contents = await prisma.resolution.findMany({
        where: {
            id: {in: contentIds}
        },
        select: {
            id: true,
            initial: true,
            number: true,
            year: true,
            date: true,
            summary: true,
            title: true,
        }
    });

    const contentMap = new Map(contents.map(c => [c.id, c]));
    const finalResults = [];
    for (const result of results) {
        const content = contentMap.get(result.resolutionID);
        if (content) {
            finalResults.push(content);
        }
    }

    return {
        data: finalResults,
        meta: {
            nextCursor: finalResults.length === PAGE_SIZE ? finalResults[finalResults.length - 1]!.id : undefined,
            pageSize: PAGE_SIZE
        }
    };
}

export async function searchResolutionsBySemantic(query: string, cursor?: string): Promise<SearchResolutionQueryResult> {
    await checkResourcePermission("resolution", "read");
    const embedding = await createOpenaiEmbedding({
        input: query,
        dimensions: EMBEDDINGS_DIMENSIONS,
        model: EMBEDDINGS_MODEL,
    });

    const vector = embedding.data[0]?.embedding;
    if (!vector) {
        throw new Error("Failed to get embedding for the query");
    }

    const SIMILARITY_THRESHOLD = 0.35;

    const safeCursorId = cursor || null;

    const vectorStr = JSON.stringify(vector);

    const results = await prisma.$queryRawTyped(semanticSearchResolutions(vectorStr, safeCursorId, SIMILARITY_THRESHOLD, PAGE_SIZE));

    const contentIds = results.map(r => r.resolutionID);
    const contents = await prisma.resolution.findMany({
        where: {
            id: {in: contentIds}
        },
        select: {
            id: true,
            initial: true,
            number: true,
            year: true,
            date: true,
            summary: true,
            title: true,
        }
    });

    const contentMap = new Map(contents.map(c => [c.id, c]));
    const finalResults = [];
    for (const result of results) {
        const content = contentMap.get(result.resolutionID);
        if (content) {
            finalResults.push(content);
        }
    }
    return {
        data: finalResults,
        meta: {
            nextCursor: finalResults.length === PAGE_SIZE ? finalResults[finalResults.length - 1]!.id : undefined,
            pageSize: PAGE_SIZE
        }
    };
}

export async function searchChunksByKeyword(keywords: string, cursor?: string) {
    await checkResourcePermission("resolution", "read");

    return await prisma.$transaction(async tx => {
        const results = await tx.$queryRawTyped(keywordSearch(keywords, cursor ?? null, PAGE_SIZE))
        const contents = await prisma.searchableContent.findMany({
            where: {
                id: {
                    in: results.map(r => r.id)
                }
            },
            include: {
                resolution: {
                    select: {
                        id: true,
                        initial: true,
                        number: true,
                        year: true,
                        date: true,
                        summary: true,
                        title: true,
                    }
                }
            },
            take: PAGE_SIZE,
            skip: cursor ? 1 : 0,
            cursor: cursor ? {id: cursor} : undefined,
        });

        const contentMap = new Map(contents.map(c => [c.id, c]));
        const finalresults = [];
        for (const result of results) {
            const content = contentMap.get(result.id);
            if (content) {
                finalresults.push(content);
            }
        }
        return finalresults;
    })
}

export async function searchChunksBySemantic(query: string, cursor?: string) {
    await checkResourcePermission("resolution", "read");

    const embedding = await createOpenaiEmbedding({
        input: query,
        dimensions: EMBEDDINGS_DIMENSIONS,
        model: EMBEDDINGS_MODEL,
    });


    const vector = embedding.data[0]?.embedding;
    if (!vector) {
        throw new Error("Failed to get embedding for the query");
    }

    const SIMILARITY_THRESHOLD = 0.35;

    const safeCursorId = cursor || null;

    const vectorStr = JSON.stringify(vector);

    const results = await prisma.$queryRawTyped(semanticSearch(vectorStr, safeCursorId, SIMILARITY_THRESHOLD, PAGE_SIZE));

    const contentIds = results.map(r => r.id);
    const contents = await prisma.searchableContent.findMany({
        where: {
            id: {in: contentIds}
        },
        include: {
            resolution: {
                select: {
                    id: true,
                    initial: true,
                    number: true,
                    year: true,
                    date: true,
                    summary: true,
                    title: true,
                }
            }
        }
    });

    const contentMap = new Map(contents.map(c => [c.id, c]));
    const finalResults = [];
    for (const result of results) {
        const content = contentMap.get(result.id);
        if (content) {
            finalResults.push(content);
        }
    }
    return finalResults;
}
