import {fetchChangesDataForAssembly, getAssembledResolution} from "@repo/resolution-assembly";
import {ArticleContentForLLM, ChangesForLLM, llmAnalyzeAdvancedChanges, ResolutionContentForLLM} from "./llm";
import {
    mapArticleContentForLLM,
    mapDBReferenceToParserReference,
    mapResolutionForLLm
} from "@/maintenance_tasks/advanced_changes/remapping";
import {fetchAdvancedChangeForTask} from "@/data/advanced_changes/changes";
import {withLlmConsistencyRetry} from "@/util/llm/retries";
import {mapAnalysis} from "@/parser/postprocessing/assemble";
import {fetchReferenceMarkersForArticle} from "@/data/advanced_changes/markers";
import {validateLlmAnalysis} from "@/maintenance_tasks/advanced_changes/validation";
import {ResolutionToShow} from "@repo/resolution-assembly/definitions/resolutions";
import {ResolutionID} from "@/parser/schemas/common";

async function processAdvancedChangesWithRetry(articleContent: ArticleContentForLLM, targetResolution: ResolutionContentForLLM, otherChanges: ChangesForLLM, modifierResolution: ResolutionContentForLLM) {
    return await withLlmConsistencyRetry(async (ctx) => {
        const llmRes = await llmAnalyzeAdvancedChanges(articleContent, targetResolution, otherChanges, modifierResolution, ctx.attempt === 1);
        validateLlmAnalysis(llmRes, targetResolution.id);
        return llmRes;
    });
}

async function mapAdvancedChangesResult(articleModifierId: string, analysisRes: Extract<Awaited<ReturnType<typeof llmAnalyzeAdvancedChanges>>, {
    success: true
}>, rootResolutionCoords: ResolutionID) {
    const usedTableNumbers = new Set<number>()
    const references = await fetchReferenceMarkersForArticle(articleModifierId);

    const referencesMapped = references.map(mapDBReferenceToParserReference);

    const changesMapped = analysisRes.changes.map((change) => {
        return mapAnalysis(change, rootResolutionCoords, analysisRes.tables, referencesMapped, usedTableNumbers)
    })
    return changesMapped;
}

export async function processAdvancedChange(changeId: string, targetResolutionId: string): Promise<{
    success: true,
    changes: ReturnType<typeof mapAnalysis>[]
} | {
    success: false,
    errorType: "ALREADY_APPLIED" | "CANT_APPLY"
}> {
    const changeData = await fetchAdvancedChangeForTask(changeId);
    if (!changeData) {
        throw new Error(`Change with ID ${changeId} not found.`);
    }

    const assembledModifierResolution = await getAssembledResolution(changeData.rootResolutionId, changeData.date);
    if (!assembledModifierResolution) {
        throw new Error(`Assembled modifier resolution for ID ${changeData.rootResolutionId} not found.`);
    }

    // TODO FIX: this includes the change itself, because of the date.

    const assembledTargetResolution = await getAssembledResolution(targetResolutionId, changeData.date);
    if (!assembledTargetResolution) {
        throw new Error(`Assembled target resolution for ID ${targetResolutionId} not found.`);
    }

    const otherChanges = await fetchChangesDataForAssembly(changeData.otherChanges);

    const articleModifierId = changeData.articleModifierId;
    const modifierArticle = findArticleInResolution(assembledModifierResolution.resolutionData, articleModifierId);
    if (!modifierArticle) {
        throw new Error(`Article with ID ${articleModifierId} not found in assembled modifier resolution.`);
    }

    const changeContentForLLM = mapArticleContentForLLM(modifierArticle)
    const targetResolutionForLLM = mapResolutionForLLm(assembledTargetResolution.resolutionData);
    const otherChangesForLLM = otherChanges;
    const modifierResolutionForLLM = mapResolutionForLLm(assembledModifierResolution.resolutionData);

    const analysisRes = await processAdvancedChangesWithRetry(changeContentForLLM, targetResolutionForLLM, otherChangesForLLM, modifierResolutionForLLM)

    if (analysisRes.success) {
        const changesMapped = await mapAdvancedChangesResult(articleModifierId, analysisRes, changeData.rootResolutionCoords);
        return {
            success: true,
            changes: changesMapped,
        }
    } else {
        return analysisRes;
    }
}

function findArticleInResolution(resolution: ResolutionToShow, articleModifierId: string) {
    let modifierArticle = resolution.articles.find(a => a.uuid === articleModifierId);
    for (const annex of resolution.annexes) {
        if (annex.type === "WITH_ARTICLES") {
            const foundInStandalone = annex.standaloneArticles.find(a => a.uuid === articleModifierId);
            if (foundInStandalone) {
                modifierArticle = foundInStandalone;
                break;
            }
            for (const chapter of annex.chapters) {
                const foundInChapter = chapter.articles.find(a => a.uuid === articleModifierId);
                if (foundInChapter) {
                    modifierArticle = foundInChapter;
                    break;
                }
            }
        }
    }
    return modifierArticle;
}
