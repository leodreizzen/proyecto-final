import { SearchFilters } from "@/lib/data/search";

export function SearchSummary({ filters, count }: { filters: SearchFilters, count?: number }) {
    const parts = [];

    if (filters.search_type === "by_id"){
        if (filters.initial) parts.push(<span key="init">Inicial: <span className="font-bold text-foreground">{filters.initial}</span></span>);
        if (filters.number) parts.push(<span key="num">N°: <span className="font-bold text-foreground">{filters.number}</span></span>);
        if (filters.year) parts.push(<span key="year">Año: <span className="font-bold text-foreground">{filters.year}</span></span>);
    } else if (filters.search_type === "semantic" || filters.search_type === "keywords") {
        parts.push(<span key="q">Término: <span className="font-bold text-foreground">{filters.q}</span></span>);
    }


    return (
        <div className="text-muted-foreground text-sm flex flex-wrap gap-1 items-center justify-center md:justify-start">
            <span>Se {count === 1 ? 'encontró' : 'encontraron'} <span className="font-bold text-foreground">{count}</span> {count === 1 ? 'resultado' : 'resultados'}</span>
            {parts.length > 0 && (
                <>
                    <span>para</span>
                    {
                        parts
                    }
                    <span></span>
                </>
            )}
        </div>
    );
}
