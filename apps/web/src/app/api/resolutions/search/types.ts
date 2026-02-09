export type SearchResolutionResult = {
    id: string,
    initial: string,
    number: number,
    year: number,
    date: Date,
    summary: string,
    title: string,
}

export type SearchResolutionQueryResult = {
    data: SearchResolutionResult[],
    meta: {
        total?: number,
        nextCursor?: string,
        pageSize: number
    }
}