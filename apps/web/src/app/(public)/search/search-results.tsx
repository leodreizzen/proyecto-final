"use client";
import {useInfiniteQuery} from "@tanstack/react-query";
import {VirtuosoGrid} from "react-virtuoso";
import {SearchFilters} from "@/lib/data/search";
import {SearchByIdReturnType} from "@/app/api/resolutions/search/id/types";
import {ResolutionCard} from "@/components/resolution-card";
import {Loader2} from "lucide-react";
import React from "react";
import {resolutionIdSearchQuery} from "@/lib/queries/search/search-queries";

interface SearchResultsProps {
    initialData: SearchByIdReturnType;
    filters: SearchFilters;
}

function GridList(props: React.ComponentProps<"div">) {
    return (
        <div
            {...props}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-8"
        />)
}


function GridItem(props: React.ComponentProps<"div">) {
    return (
        <div {...props} className="h-full"/>
    )
}


export function SearchResults({initialData, filters}: SearchResultsProps) {
    const [isMounted, setIsMounted] = React.useState(false);
    React.useEffect(() => {
        setIsMounted(true);
    }, []);
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        ...resolutionIdSearchQuery(filters),
        initialData: {
            pages: [initialData],
            pageParams: [undefined],
        },
    });
    const allResolutions = data.pages.flatMap((page) => page.data);
    const totalCount = initialData.meta.total;

    if (totalCount === 0) {
        return (
            <div className="py-20 text-center text-muted-foreground">
                <p className="text-lg font-medium mb-2">No se encontraron resultados</p>
                <p className="text-sm">Intentá ajustar los filtros o probar con términos más generales.</p>
            </div>
        );
    }

    if (!isMounted) {
        // Prevent layout shift on hydration
        return (
            <GridList>
                {initialData.data.map((resolution) => (
                    <GridItem key={resolution.id}>
                        <ResolutionCard
                            key={resolution.id}
                            resolution={resolution}
                            showExactDate={true}
                        />
                    </GridItem>
                ))}
            </GridList>
        );
    }

    return (
        <div className="space-y-6 mb-5">
            <VirtuosoGrid
                useWindowScroll
                data={allResolutions}
                computeItemKey={(_index, item) => item.id}
                endReached={() => {
                    if (hasNextPage && !isFetchingNextPage) {
                        fetchNextPage();
                    }
                }}
                overscan={400}
                components={{
                    List: GridList,
                    Item: GridItem,
                    Footer: () => (
                        <div className="py-4 flex justify-center col-span-full">
                            {isFetchingNextPage && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>}
                            {!hasNextPage && allResolutions.length > 0 && (
                                <p className="text-xs text-muted-foreground">Fin de los resultados</p>
                            )}
                        </div>
                    )
                }}
                itemContent={(_index, resolution) => (
                    <ResolutionCard
                        resolution={resolution}
                        showExactDate={true}
                    />
                )}
            />
        </div>
    );
}
