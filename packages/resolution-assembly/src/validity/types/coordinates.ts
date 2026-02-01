export type ResolutionCoords = {
    initial: string,
    number: number,
    year: number
}

export type AnnexCoords = {
    parent: ResolutionCoords, // TODO subannexes?
    annexNumber: number
}

export type ChapterCoords = {
    parent: AnnexCoords,
    chapterNumber: number
}

export type ArticleCoords = {
    parent: {
        type: "resolution",
        coords: ResolutionCoords
    } | {
        type: "annex",
        coords: AnnexCoords
    } | {
        type: "chapter",
        coords: ChapterCoords
    },
    articleNumber: number,
    articleSuffix: number | null
}

export type NodeCoordinates =
    | { type: "resolution", coords: ResolutionCoords }
    | { type: "annex", coords: AnnexCoords }
    | { type: "chapter", coords: ChapterCoords }
    | { type: "article", coords: ArticleCoords };