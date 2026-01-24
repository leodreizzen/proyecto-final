import {ChangeValidityService} from "@/lib/assembly/validity/change-validity-service";
import {getRelevantChangesList} from "@/lib/data/changes/relevant-changes";
import {getChangesDataForValidityGraph} from "@/lib/data/changes/validity-graph";
import {getChangesContext} from "@/lib/data/changes/context";
import {ChangeContext, ChangeWithContextForAssembly, ChangeWithIDAndContext} from "@/lib/definitions/changes";
import {ResolutionVersion} from "@/lib/definitions/resolutions";
import {sortChangeWithContext} from "@/lib/assembly/utils";
import {stableStringify} from "@/lib/utils";
import {ChangeDataForAssembly, fetchChangesDataForAssembly} from "@/lib/data/changes/assembly";

export async function getValidChangesAndVersionsForAssembly(resUuid: string, versionDate: Date | null) {
    const relevantChangeList = await getRelevantChangesList(resUuid);

    const changeIdsToSearch = relevantChangeList.filter(c => !versionDate || c.date <= versionDate).map(c => c.id);

    const contexts = await getChangesContext(changeIdsToSearch);
    const validChangesIDs = await getValidChangesIds(changeIdsToSearch, contexts);
    const changesData = await fetchChangesDataForAssembly(validChangesIDs);
    const versions  = getVersionsFromChanges(contexts);
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


function getVersionsFromChanges(changes: Map<string, ChangeContext>): ResolutionVersion[] {
    const allChanges: ChangeWithIDAndContext[] = Array.from(changes.entries()).map(([id, context]) => ({
        id,
        context
    }));

    allChanges.sort(sortChangeWithContext);

    const versions: ResolutionVersion[] = [];
    const seenResolutions = new Set<string>();

    for (const change of allChanges) {
        const res = change.context.rootResolution;
        const key = stableStringify(res);

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