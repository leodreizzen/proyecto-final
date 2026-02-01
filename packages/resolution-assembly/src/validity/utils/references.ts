import {NodeCoordinates} from "../types/coordinates";
import {
    AnnexReference,
    ArticleReference,
    ChapterReference, ObjectForGraph,
    Reference,
    ResolutionReference, ValidReference
} from "../types/definitions";

export function genericReferenceToCoordinates(ref: Reference): NodeCoordinates {
    if (ref.resolution) {
        return resolutionReferenceToCoordinates(ref.resolution);
    } else if (ref.article) {
        return articleReferenceToCoordinates(ref.article);
    } else if (ref.annex) {
        return annexReferenceToCoordinates(ref.annex);
    } else if (ref.chapter) {
        return chapterReferenceToCoordinates(ref.chapter);
    } else {
        throw new Error("Inconsistent reference data");
    }
}

export function resolutionReferenceToCoordinates(ref: ResolutionReference): NodeCoordinates {
    const coords = {
        initial: ref.initial,
        number: ref.number,
        year: ref.year
    } as const;

    return {
        type: "resolution",
        coords
    }
}

export function articleReferenceToCoordinates(ref: ArticleReference): NodeCoordinates {
    const res = {
        initial: ref.initial,
        number: ref.resNumber,
        year: ref.year

    } as const;

    const annex = ref.annexNumber !== null ? {
        parent: res,
        annexNumber: ref.annexNumber

    } as const : null;

    const chapter = annex && ref.chapterNumber !== null ? {
        parent: annex,
        chapterNumber: ref.chapterNumber

    } as const : null;

    const parent = chapter ? {
        type: "chapter",
        coords: chapter
    } as const : annex ? {
        type: "annex",
        coords: annex
    } as const : {
        type: "resolution",
        coords: res
    } as const;

    return {
        type: "article",
        coords: {
            parent,
            articleNumber: ref.articleNumber,
            articleSuffix: ref.articleSuffix,
        }
    }
}

export function annexReferenceToCoordinates(ref: AnnexReference): NodeCoordinates {
    const res = {
        initial: ref.initial,
        number: ref.resNumber,
        year: ref.year
    } as const;
    const coords = {
        parent: res,
        annexNumber: ref.annexNumber
    } as const;

    return {
        type: "annex",
        coords
    }
}

export function chapterReferenceToCoordinates(ref: ChapterReference): NodeCoordinates {
    const res = {
        initial: ref.initial,
        number: ref.resNumber,
        year: ref.year
    } as const;
    const annex = {
        parent: res,
        annexNumber: ref.annexNumber
    } as const;
    const coords = {
        parent: annex,
        chapterNumber: ref.chapterNumber
    } as const;

    return {
        type: "chapter",
        coords
    };
}

export function extractParentCoords(childCoords: NodeCoordinates): NodeCoordinates | null {
    switch (childCoords.type) {
        case 'resolution':
            return null;

        case 'annex':
            return {
                type: 'resolution',
                coords: childCoords.coords.parent
            };

        case 'chapter':
            return {
                type: 'annex',
                coords: childCoords.coords.parent
            };

        case 'article':
            return childCoords.coords.parent;
    }
}

export function articleRefToPayload(ref: ArticleReference): ObjectForGraph | null {
    if (!ref.article) {
        return null
    }

    return {
        type: "article",
        object: ref.article
    };
}

export function resolutionRefToPayload(ref: ResolutionReference): ObjectForGraph | null {
    if (!ref.resolution) {
        return null
    }

    return {
        type: "resolution",
        object: ref.resolution
    };
}

export function annexRefToPayload(ref: AnnexReference): ObjectForGraph | null {
    if (!ref.annex) {
        return null
    }

    return {
        type: "annex",
        object: ref.annex
    };
}

export function chapterRefToPayload(ref: ChapterReference): ObjectForGraph | null {
    if (!ref.chapter) {
        return null
    }

    return {
        type: "chapter",
        object: ref.chapter
    };
}

export function genericRefToPayload(ref: Reference): ObjectForGraph | null {
    const validRef = checkReference(ref);
    switch (validRef.targetType) {
        case "RESOLUTION":
            return resolutionRefToPayload(validRef.resolution);
        case "ARTICLE":
            return articleRefToPayload(validRef.article);
        case "ANNEX":
            return annexRefToPayload(validRef.annex);
        case "CHAPTER":
            return chapterRefToPayload(validRef.chapter);
        default: {
            const _exhaustiveCheck: never = validRef;
            return null;
        }
    }
}

function checkReference(ref: Reference): ValidReference {
    const validReference = (ref: Reference): ref is ValidReference => {
        if (ref.targetType === "RESOLUTION") {
            return !!ref.resolution;
        }
        if (ref.targetType === "ARTICLE") {
            return !!ref.article;
        }
        if (ref.targetType === "ANNEX") {
            return !!ref.annex;
        }
        if (ref.targetType === "CHAPTER") {
            return !!ref.chapter;
        }
        const _exhaustiveCheck: never = ref.targetType;
        return false;
    }
    if (!validReference(ref))
        throw new Error("Invalid reference");

    return ref;
}
