import {ChangeValidityService} from "./change-validity-service";
import {getRelevantChangesList} from "../data/relevant-changes";
import {getChangesDataForValidityGraph} from "../data/validity-graph";
import {getChangesContext} from "../data/context";
import {ChangeContext, ChangeWithContextForAssembly, ChangeWithIDAndContext} from "../definitions/changes";
import {ResolutionNaturalID, ResolutionVersion, VersionSpec} from "../definitions/resolutions";
import {sortChangeWithContext} from "../utils";
import {stableStringify} from "../utils/serialization";
import {ChangeDataForAssembly, fetchChangesDataForAssembly} from "../data/changes";

export async function getValidChangesAndVersionsForAssembly(resUuid: string, naturalId: ResolutionNaturalID, versionSpec: VersionSpec) {
    const relevantChangeList = await getRelevantChangesList(resUuid);
    const contexts = await getChangesContext(relevantChangeList.map(c => c.id));

    const allChangesWithContext: ChangeWithIDAndContext[] = addContextToChanges(relevantChangeList, contexts);

    const filteredChanges = filterChangesByVersionSpec(allChangesWithContext, versionSpec);

    const filteredChangeIDs = filteredChanges.map(c => c.id);
    const validChangesIDs = await getValidChangesIds(filteredChangeIDs, contexts);

    const changesData = await fetchChangesDataForAssembly(validChangesIDs);
    const versions = getVersionsFromChanges(contexts, naturalId);
    const changes = addContextToChanges(changesData, contexts);

    return {
        changes,
        versions
    }
}

function filterChangesByVersionSpec(allChanges: ChangeWithIDAndContext[], versionSpec: VersionSpec): ChangeWithIDAndContext[] {
    allChanges.sort(sortChangeWithContext);

    let cutoffIndex = allChanges.length - 1; // Index of the last change to include
    let found = false;
    if (versionSpec.causedBy) {
        const modifierPredicate = (ch: ChangeWithIDAndContext) => {
            const changeRes = ch.context.rootResolution;
            return changeRes.initial === versionSpec.causedBy!.initial &&
                changeRes.number === versionSpec.causedBy!.number &&
                changeRes.year === versionSpec.causedBy!.year;
        }

        if (versionSpec.exclusive) {
            const predicateRes = allChanges.findIndex(modifierPredicate);
            if (predicateRes !== -1) {
                cutoffIndex = predicateRes - 1;
                found = true;
            }
        } else {
            const predicateRes = allChanges.findLastIndex(modifierPredicate);
            if (predicateRes !== -1) {
                cutoffIndex = predicateRes;
                found = true;
            }
        }
    }

    if (!found && versionSpec.date) {
        const versionDate = versionSpec.date;
        if (versionSpec.exclusive) {
            const predicateRes = allChanges.findIndex(c => c.context.date >= versionDate);
            if (predicateRes !== -1)
                cutoffIndex = predicateRes - 1;
            // else leave as is (all changes are before the date)
        } else {
            const predicateRes = allChanges.findLastIndex(c => c.context.date <= versionDate);
            if (predicateRes !== -1) {
                cutoffIndex = predicateRes;
            } else {
                cutoffIndex = -1; // No changes with date before or equal to the specified date
            }
        }
    }

    return allChanges.slice(0, cutoffIndex + 1);
}


async function getValidChangesIds(changeIds: string[], contexts: Map<string, ChangeContext>): Promise<string[]> {
    const changesDataForGraph = await getChangesDataForValidityGraph(changeIds, contexts);
    const service = new ChangeValidityService();
    service.loadChanges(changesDataForGraph);
    return service.getValidChanges();
}


function getVersionsFromChanges(changes: Map<string, ChangeContext>, thisResolutionId: ResolutionNaturalID): ResolutionVersion[] {
    const allChanges: ChangeWithIDAndContext[] = Array.from(changes.entries()).map(([id, context]) => ({
        id,
        context
    }));

    allChanges.sort(sortChangeWithContext);

    const versions: ResolutionVersion[] = [];
    const seenResolutions = new Set<string>();
    const thisKey = stableStringify(thisResolutionId);

    for (const change of allChanges) {
        const res = change.context.rootResolution;
        const key = stableStringify(res);

        if (key === thisKey)
            continue; // Skip versions caused by this resolution itself

        if (!seenResolutions.has(key)) {
            seenResolutions.add(key);

            versions.push({
                date: change.context.date,
                causedBy: res
            });
        }
    }

    return versions;
}

function addContextToChanges(changesData: ChangeDataForAssembly[], contexts: Map<string, ChangeContext>): ChangeWithContextForAssembly[]
function addContextToChanges(changesData: {
    id: string
}[], contexts: Map<string, ChangeContext>): ChangeWithIDAndContext[]
function addContextToChanges<T extends { id: string }>(changesData: T[], contexts: Map<string, ChangeContext>): (T & {
    context: ChangeContext
})[] {
    return changesData.map(change => {
        const context = contexts.get(change.id);
        if (!context) {
            throw new Error("No context found for change with id " + change.id);
        }
        return {
            ...change,
            context
        }
    });
}