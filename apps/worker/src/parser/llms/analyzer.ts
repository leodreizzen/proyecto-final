import {ResolutionStructure} from "@/parser/schemas/structure_parser/schemas";
import {LLMError, ResultWithData} from "@/definitions";
import {FullResolutionAnalysis,} from "@/parser/types";
import {tableAnalyzer} from "@/parser/llms/analyzer/table_analyzer";
import {extractReferences} from "@/parser/llms/analyzer/reference_extractor";
import {merge} from "lodash-es";
import {analyzeAnnex} from "@/parser/llms/analyzer/annex_analyzer";
import {analyzeMainResolution} from "@/parser/llms/analyzer/main_resolution_analyzer";

import {validateReferenceConsistency} from "@/parser/llms/analyzer/reference_consistency";

export async function analyzeFullResolution(resolution: ResolutionStructure): Promise<ResultWithData<FullResolutionAnalysis, LLMError>> {
    const mainAnalysisRes = await analyzeMainResolution(resolution);
    if (!mainAnalysisRes.success) {
        return mainAnalysisRes;
    }
    const mainResolutionAnalysis = mainAnalysisRes.data;

    const annexPromises = resolution.annexes.map((annex, index) =>
        analyzeAnnex({
            resolutionArticles: resolution.articles,
            annex,
            annexNumber: index + 1,
            recitals: resolution.recitals,
            considerations: resolution.considerations,
            resolutionId: resolution.id,
            metadata: mainResolutionAnalysis.metadata
        })
    );
    const referenceAnalysisPromise = extractReferences(resolution);
    const tableAnalysisPromise = tableAnalyzer(resolution.tables);

    const annexResults = await Promise.all(annexPromises);
    const firstFailed = annexResults.find(result => !result.success);
    if (firstFailed !== undefined) {
        const firstError = firstFailed.error;
        return {
            success: false,
            error: firstError
        };
    }
    const annexes = annexResults.map(result => (result as typeof result & {success: true}).data);

    const referenceAnalysisResult = await referenceAnalysisPromise;
    if (!referenceAnalysisResult.success) {
        return referenceAnalysisResult;
    }

    const tableAnalysisRes = await tableAnalysisPromise;
    if (!tableAnalysisRes.success) {
        console.error(JSON.stringify(tableAnalysisRes.error));
        return tableAnalysisRes;
    }

    const tableAnalysis = tableAnalysisRes.data;

    const consistencyValidationRes = validateReferenceConsistency(mainResolutionAnalysis, annexes, referenceAnalysisResult.data);
    if (!consistencyValidationRes.success) {
        console.error(JSON.stringify(consistencyValidationRes.error));
        return {
            success: false,
            error: {
                code: "validation_error"
            }
        }
    }

    return {
        success: true,
        data: merge ({
            ...mainResolutionAnalysis,
            annexes: annexes,
            tables: tableAnalysis
        }, referenceAnalysisResult.data)
    }
}
