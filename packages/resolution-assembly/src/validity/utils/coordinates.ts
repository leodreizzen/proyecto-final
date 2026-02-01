import {AnnexCoords, ArticleCoords, ChapterCoords, NodeCoordinates} from "../types/coordinates";

export function calculateChildArticleCoords(parentCoords: NodeCoordinates, number: number, suffix: number | null): ArticleCoords {
    {
        if (parentCoords.type === 'resolution') {
            return {
                parent: {type: 'resolution', coords: parentCoords.coords},
                articleNumber: number,
                articleSuffix: suffix
            };
        } else if (parentCoords.type === 'annex') {
            return {
                parent: {type: 'annex', coords: parentCoords.coords}, articleNumber: number, articleSuffix: suffix
            };
        } else if (parentCoords.type === 'chapter') {
            return {
                parent: {type: 'chapter', coords: parentCoords.coords}, articleNumber: number, articleSuffix: suffix
            };
        }
        throw new Error("Invalid parent for Article");
    }
}

export function calculateChildChapterCoords(parentAnnexCoords: NodeCoordinates, number: number): ChapterCoords {
    if (parentAnnexCoords.type === 'annex') {
        return {
            parent: parentAnnexCoords.coords,
            chapterNumber: number
        };
    }
    throw new Error("Invalid parent for Chapter (must be Annex)");
}

export function calculateChildAnnexCoords(parentCoords: NodeCoordinates, number: number): AnnexCoords {
    if (parentCoords.type === 'resolution') {
        return {
            parent: parentCoords.coords,
            annexNumber: number
        };
    }
    // TODO: subannexes
    throw new Error("Invalid parent for Annex (must be Resolution)");
}
