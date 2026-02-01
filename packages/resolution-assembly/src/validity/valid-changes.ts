import {ChangeValidityService} from "./change-validity-service";
import {getRelevantChangesList} from "../data/relevant-changes";
import {getChangesDataForValidityGraph} from "../data/validity-graph";
import {getChangesContext} from "../data/context";
import {ChangeContext, ChangeWithContextForAssembly, ChangeWithIDAndContext} from "../definitions/changes";
import {ResolutionNaturalID, ResolutionVersion} from "../definitions/resolutions";
import {sortChangeWithContext} from "../utils";
import {stableStringify} from "../utils/serialization";
import {ChangeDataForAssembly, fetchChangesDataForAssembly} from "../data/changes";

export async function getValidChangesAndVersionsForAssembly(resUuid: string, naturalId: ResolutionNaturalID ,versionDate: Date | null) {
    const relevantChangeList = await getRelevantChangesList(resUuid);
    const contexts = await getChangesContext(relevantChangeList.map(c => c.id));

    const changeIdsToSearch = relevantChangeList.filter(c => !versionDate || c.date <= versionDate).map(c => c.id);
    const validChangesIDs = await getValidChangesIds(changeIdsToSearch, contexts);
    const changesData = await fetchChangesDataForAssembly(validChangesIDs);
    const versions  = getVersionsFromChanges(contexts, naturalId);
    const changes = addContextToChanges(changesData, contexts);

    return {
        changes,
        versions
    }
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

function addContextToChanges(changesData: ChangeDataForAssembly[], contexts: Map<string, ChangeContext>): ChangeWithContextForAssembly[] {
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