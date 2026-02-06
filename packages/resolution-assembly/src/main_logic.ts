import { findResolutionInitialData, ResolutionDBDataToShow } from "./data/resolutions";
import {
    AnnexToShow,
    ArticleToShow,
    ConsiderationToShow,
    RecitalToShow,
    ResolutionNaturalID,
    ResolutionToShow,
    VersionSpec,
} from "./definitions/resolutions";
import { getValidChangesAndVersionsForAssembly } from "./validity/valid-changes";
import { articleInitialDataToShow } from "./remapping/article-to-show";
import { annexInitialDataToShow } from "./remapping/annex-to-show";
import { ResolutionChangeApplier } from "./resolution-change-applier";
import { ChangeWithContextForAssembly, InapplicableChange } from "./definitions/changes";
import { sortResolution } from "./sorter";
import { getDownloadUrl } from "./utils/assets";
import { mapContentBlocks } from "./remapping/content-blocks";
import { validateReferences, ValidationContext } from "./processing/reference-processor";
import {
    collectReferencesFromChanges,
    collectReferencesFromResolution
} from "./collect-references";

export async function getAssembledResolution(resolutionId: string, versionSpec: VersionSpec) {
    const resolution = await findResolutionInitialData(resolutionId);
    if (!resolution) {
        return null;
    }

    const id: ResolutionNaturalID = { initial: resolution.initial, number: resolution.number, year: resolution.year };
    const { changes, versions } = await getValidChangesAndVersionsForAssembly(resolutionId, id, versionSpec);

    const resolutionReferences = collectReferencesFromResolution(resolution);
    const changesReferences = collectReferencesFromChanges(changes);

    const allReferences = [...resolutionReferences, ...changesReferences];

    const validationContext = await validateReferences(allReferences);

    const dataToShow = getInitialDataToShow(resolution, validationContext);

    const { updatedResolution: finalResolution, inapplicableChanges } = applyChangesToResolution(dataToShow, changes, validationContext);
    sortResolution(finalResolution);

    versions.unshift({
        date: resolution.date,
        causedBy: finalResolution.id
    })

    return { resolutionData: finalResolution, versions, inapplicableChanges };
}

function getInitialDataToShow(resolution: ResolutionDBDataToShow, validationContext: ValidationContext): ResolutionToShow {
    const id: ResolutionNaturalID = { initial: resolution.initial, number: resolution.number, year: resolution.year };
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
        summary: resolution.summary,
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

function applyChangesToResolution(resolution: ResolutionToShow, changes: ChangeWithContextForAssembly[], validationContext: ValidationContext): { updatedResolution: ResolutionToShow, inapplicableChanges: InapplicableChange[] } {
    const applier = new ResolutionChangeApplier(resolution, validationContext);
    applier.applyChanges(changes);
    return {
        updatedResolution: applier.getUpdatedResolution(),
        inapplicableChanges: applier.getInapplicableChanges()
    };
}
