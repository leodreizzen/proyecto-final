import {ChangeWithIDAndContext} from "@/lib/definitions/changes";

export function sortChangeWithContext(c1: ChangeWithIDAndContext, c2: ChangeWithIDAndContext): number {
    const dateDiff = c1.context.date.getTime() - c2.context.date.getTime();
    if (dateDiff !== 0) {
        return dateDiff;
    }
    const resNumberDiff = c1.context.rootResolution.number - c2.context.rootResolution.number;
    if (resNumberDiff !== 0) {
        return resNumberDiff;
    }
    const resInitialDiff = c1.context.rootResolution.initial.localeCompare(c2.context.rootResolution.initial);
    if (resInitialDiff !== 0) {
        return resInitialDiff;
    }

    return c1.id.localeCompare(c2.id);
}