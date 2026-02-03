import {AdvancedChangeResult} from "@/maintenance_tasks/advanced_changes/schemas";
import {ResolutionID} from "@/parser/schemas/common";
import {validateChangeTables} from "@/parser/llms/validation/table_validator";
import {LLMConsistencyValidationError} from "@/parser/llms/errors";

export function validateLlmAnalysis(analysis: AdvancedChangeResult, resolutionCoords: ResolutionID) {
    if (!analysis.success)
        return;

    const validTableNumbers = new Set<number>(analysis.tables.map(t => t.number));

    const errors: string[] = [];
    analysis.changes.forEach((change, i) => {
        validateChangeTables(change, validTableNumbers, `Change ${i + 1} (1-based)`, errors)
        validateChangeTargets(change, resolutionCoords, `Change ${i + 1} (1-based)`, errors);
    })
    if (errors.length > 0) {
        throw new LLMConsistencyValidationError(`Table reference validation failed:\n${errors.join("\n")}`);
    }
}

function validateChangeTargets(change: (AdvancedChangeResult & {
    success: true
})["changes"][number], resolutionCoords: ResolutionID, context: string, errors: string[]) {
    const target = getChangeTarget(change);
    if (!target) {
        return;
    }
    let targetResId;
    switch (target.referenceType) {
        case "Resolution":
            targetResId = target.resolutionId;
            break;
        case "Annex":
            targetResId = target.resolutionId;
            break;
        case "NormalArticle":
            targetResId = target.resolutionId;
            break;
        case "AnnexArticle":
            targetResId = target.annex.resolutionId;
            break;
        case "Chapter":
            targetResId = target.annex.resolutionId;
            break;
        default: {
            const _exhaustiveCheck: never = target;
            return;
        }
    }

    const targetInitial = resolutionCoords.initial;
    const targetNumber = resolutionCoords.number;
    const targetYear = resolutionCoords.year;

    if (targetResId.initial !== targetInitial || targetResId.number !== targetNumber || targetResId.year !== targetYear) {
        errors.push(`${context}: Target resolution ID mismatch. Expected ${targetInitial} ${targetNumber} ${targetYear}, got ${targetResId.initial} ${targetResId.number} ${targetResId.year}`);
    }
}

function getChangeTarget(change: (AdvancedChangeResult & { success: true })["changes"][number]) {
    switch (change.type) {
        case "ModifyArticle":
            return change.targetArticle;
        case "ReplaceArticle":
            return change.targetArticle;
        case "AddArticleToResolution":
            return {referenceType: "Resolution" as const, resolutionId: change.targetResolution};
        case "AddArticleToAnnex":
            return change.target;
        case "ReplaceAnnex":
            return change.targetAnnex;
        case "AddAnnexToAnnex":
            return change.target;
        case "AddAnnexToResolution":
            return {referenceType: "Resolution" as const, resolutionId: change.targetResolution};
        case "Repeal":
            return change.target;
        case "RatifyAdReferendum":
            return {referenceType: "Resolution" as const, resolutionId: change.resolutionToRatify};
        case "ApplyModificationsAnnex":
            return change.annexToApply;
        case "ModifyTextAnnex":
            return change.targetAnnex;
        default: {
            const _exhaustiveCheck: never = change;
            return null;
        }
    }
}