import {ResolutionStructure} from "@/parser/schemas/structure_parser/schemas";
import {ResultWithData} from "@/definitions";
import {FullResolutionAnalysis, ParseResolutionError,} from "@/parser/types";
import {analyze_tables} from "@/parser/llms/analyzer/table_analyzer";
import {extractReferences} from "@/parser/llms/analyzer/reference_extractor";
import {merge} from "lodash-es";
import {analyzeAnnex} from "@/parser/llms/analyzer/annex_analyzer";
import {analyzeMainResolution} from "@/parser/llms/analyzer/main_resolution_analyzer";

import {validateReferenceConsistency} from "@/parser/llms/analyzer/reference_consistency";
import {LLMConsistencyValidationError} from "@/parser/llms/errors";
import {withLlmConsistencyRetry} from "@/util/llm/retries";

export async function analyzeFullResolution(resolution: ResolutionStructure): Promise<ResultWithData<FullResolutionAnalysis, ParseResolutionError>> {
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
    const tableAnalysisPromise = analyze_tables(resolution.tables);

    const annexResults = await Promise.all(annexPromises);
    const firstFailed = annexResults.find(result => !result.success);
    if (firstFailed !== undefined) {
        return firstFailed;
    }

    const annexes = annexResults.map(result => (result as typeof result & {success: true}).data);

    const tableAnalysis = await tableAnalysisPromise;

    const referenceAnalysisResult = await withLlmConsistencyRetry(async ()=> {
        const referenceAnalysisResult = await referenceAnalysisPromise;
        const consistencyValidationRes = validateReferenceConsistency(mainResolutionAnalysis, annexes, referenceAnalysisResult);
        if (!consistencyValidationRes.success) {
            console.error(JSON.stringify(consistencyValidationRes.error));
            throw new LLMConsistencyValidationError(consistencyValidationRes.error);
        }
        return referenceAnalysisResult;
    })


    return {
        success: true,
        data: merge ({
            ...mainResolutionAnalysis,
            annexes: annexes,
            tables: tableAnalysis
        }, referenceAnalysisResult)
    }
}
