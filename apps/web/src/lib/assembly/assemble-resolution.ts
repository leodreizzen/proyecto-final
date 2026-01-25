import {fetchResolutionInitialData, ResolutionDBDataToShow} from "@/lib/data/resolutions";
import {
    AnnexToShow,
    ArticleToShow,
    ConsiderationToShow, RecitalToShow,
    ResolutionNaturalID,
    ResolutionToShow,
} from "@/lib/definitions/resolutions";
import {notFound} from "next/navigation";
import {assign} from "@/lib/utils";
import {getValidChangesAndVersionsForAssembly} from "@/lib/assembly/validity/valid-changes";
import {articleInitialDataToShow} from "@/lib/data/remapping/article-to-show";
import {annexInitialDataToShow} from "@/lib/data/remapping/annex-to-show";
import {mapTablesToContent} from "@/lib/data/remapping/tables";
import {ResolutionChangeApplier} from "@/lib/assembly/resolution-change-applier";
import {ChangeWithContextForAssembly} from "@/lib/definitions/changes";
import {sortResolution} from "@/lib/assembly/sorter";

export async function getAssembledResolution(resolutionId: string, versionDate: Date | null) {
    const resolution = await fetchResolutionInitialData(resolutionId);
    if (!resolution) {
        notFound();
    }
    const dataToShow = getInitialDataToShow(resolution);
    const {changes, versions} = await getValidChangesAndVersionsForAssembly(resolutionId, dataToShow.id, versionDate);

    const finalResolution = applyChangesToResolution(dataToShow, changes);
    sortResolution(finalResolution);

    versions.unshift({
        date: resolution.date,
        causedBy: finalResolution.id
    })

    return {resolutionData: finalResolution, versions};
}

function getInitialDataToShow(resolution: ResolutionDBDataToShow): ResolutionToShow {
    const id: ResolutionNaturalID = {initial: resolution.initial, number: resolution.number, year: resolution.year};
    const recitals: RecitalToShow[] = resolution.recitals.map(recital => assign(recital, ["tables"], mapTablesToContent(recital.tables)));
    const considerations: ConsiderationToShow[] = resolution.considerations.map(consideration => assign(consideration, ["tables"], mapTablesToContent(consideration.tables)));
    const articles: ArticleToShow[] = resolution.articles.map(a => articleInitialDataToShow(a));
    const annexes: AnnexToShow[] = resolution.annexes.map(annex => annexInitialDataToShow(annex));

    return {
        id,
        recitals,
        considerations,
        articles,
        annexes,
        caseFiles: resolution.caseFiles,
        decisionBy: resolution.decisionBy,
        date: resolution.date,
        repealedBy: null,
        ratifiedBy: null,
        originalFileId: resolution.originalFileId
    }
}

function applyChangesToResolution(resolution: ResolutionToShow, changes: ChangeWithContextForAssembly[]): ResolutionToShow {
    const applier = new ResolutionChangeApplier(resolution);
    applier.applyChanges(changes);
    return applier.getUpdatedResolution();
}