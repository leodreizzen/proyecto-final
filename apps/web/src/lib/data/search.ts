import prisma from "@/lib/prisma";
import { Prisma } from "@repo/db/prisma/client";
import {checkResourcePermission} from "@/lib/auth/data-authorization";

export type SearchFilters = {
    initial?: string;
    number?: number;
    year?: number;
}

const PAGE_SIZE = 12; // multiple of 3 and 2 for grid layouts

export async function searchResolutions(filters: SearchFilters, cursor?: string) {
    await checkResourcePermission("resolution", "read");
    const where: Prisma.ResolutionWhereInput = {};

    if (filters.initial) {
        where.initial = { equals: filters.initial, mode: "insensitive" };
    }
    
    if (filters.number) {
        where.number = filters.number;
    }
    
    if (filters.year) {
        where.year = filters.year;
    }

    const [count, data] = await prisma.$transaction([
        prisma.resolution.count({ where }),
        prisma.resolution.findMany({
            where,
            orderBy: [
                { date: 'desc' },
                { number: 'desc' }
            ],
            take: PAGE_SIZE,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
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
