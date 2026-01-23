const paramsRegex = /^(\w+)-(\d+)-(\d+)$/;

export function slugToResID(publicId: string) {
    const match = publicId.match(paramsRegex);
    if (!match) {
        return null;
    }
    const [, initial, number, year] = match;
    return {
        initial: initial!.toUpperCase(),
        number: parseInt(number!, 10),
        year: parseInt(year!, 10)
    }
}

export function resIDToSlug(resId: { initial: string; number: number; year: number }) {
    if (resId.initial.includes('-')) {
        throw new Error("Invalid initial: cannot contain hyphens");
    }
    return `${resId.initial.toUpperCase()}-${resId.number}-${resId.year}`;
}

export function pathForResolution(resId: { initial: string; number: number; year: number }) {
    return `/resolution/${resIDToSlug(resId)}`;
}