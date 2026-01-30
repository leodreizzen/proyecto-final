export type SearchByIdReturnType = {
    data: {
        id: string;
        initial: string;
        number: number;
        year: number;
        title: string | null;
        summary: string;
        date: Date
    }[];
    meta: {
        total: number;
        nextCursor?: string;
        pageSize: number;
    };
}
