import {fetchResolutionInitialData, ResolutionDBDataToShow} from "@/lib/data/resolutions";
import {
    AnnexToShow,
    ArticleToShow,
    ConsiderationToShow,
    RecitalToShow,
    ResolutionNaturalID,
    ResolutionToShow,
} from "@/lib/definitions/resolutions";
import {notFound} from "next/navigation";
import {getValidChangesAndVersionsForAssembly} from "@/lib/assembly/validity/valid-changes";
import {articleInitialDataToShow} from "@/lib/data/remapping/article-to-show";
import {annexInitialDataToShow} from "@/lib/data/remapping/annex-to-show";
import {ResolutionChangeApplier} from "@/lib/assembly/resolution-change-applier";
import {ChangeWithContextForAssembly} from "@/lib/definitions/changes";
import {sortResolution} from "@/lib/assembly/sorter";
import {getDownloadUrl} from "@/lib/file-storage/urls";
import {mapContentBlocks} from "@/lib/data/remapping/content-blocks";
import {validateReferences, ValidationContext} from "@/lib/processing/reference-processor";
import {
    collectReferencesFromChanges,
    collectReferencesFromResolution
} from "@/lib/assembly/collect-references";

export async function getAssembledResolution(resolutionId: string, versionDate: Date | null) {
    const resolution = await fetchResolutionInitialData(resolutionId);
    if (!resolution) {
        notFound();
    }

    const id: ResolutionNaturalID = {initial: resolution.initial, number: resolution.number, year: resolution.year};
    const {changes, versions} = await getValidChangesAndVersionsForAssembly(resolutionId, id, versionDate);

    const resolutionReferences = collectReferencesFromResolution(resolution);
    const changesReferences = collectReferencesFromChanges(changes);

    const allReferences = [...resolutionReferences, ...changesReferences];

    const validationContext = await validateReferences(allReferences);

    const dataToShow = getInitialDataToShow(resolution, validationContext);

    const finalResolution = applyChangesToResolution(dataToShow, changes, validationContext);
    sortResolution(finalResolution);

    versions.unshift({
        date: resolution.date,
        causedBy: finalResolution.id
    })

    return {resolutionData: finalResolution, versions};
}

function getInitialDataToShow(resolution: ResolutionDBDataToShow, validationContext: ValidationContext): ResolutionToShow {
    const id: ResolutionNaturalID = {initial: resolution.initial, number: resolution.number, year: resolution.year};
    const recitals: RecitalToShow[] = resolution.recitals.map(recital => ({
        number: recital.number,
        content: mapContentBlocks(recital.content, validationContext)
    }));
    const considerations: ConsiderationToShow[] = resolution.considerations.map(consideration => ({
        number: consideration.number,
        content: mapContentBlocks(consideration.content, validationContext)
    }));
    const articles: ArticleToShow[] = resolution.articles.map(a => articleInitialDataToShow(a, undefined, validationContext));
    const annexes: AnnexToShow[] = resolution.annexes.map(annex => annexInitialDataToShow(annex, undefined, validationContext));

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
        originalFileUrl: getDownloadUrl(resolution.originalFile)
    }
}

function applyChangesToResolution(resolution: ResolutionToShow, changes: ChangeWithContextForAssembly[], validationContext: ValidationContext): ResolutionToShow {
    const applier = new ResolutionChangeApplier(resolution, validationContext);
    applier.applyChanges(changes);
    return applier.getUpdatedResolution();
}