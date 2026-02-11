import {ResolutionStructure} from "@/parser/schemas/structure_parser/schemas";
import {ResultWithData} from "@/definitions";
import {FullResolutionAnalysis, ParseResolutionError,} from "@/parser/types";
import {analyze_tables} from "@/parser/llms/analyzer/table_analyzer";
import {extractReferences} from "@/parser/llms/analyzer/reference_extractor";
import {merge} from "lodash-es";
import {analyzeAnnex, ParseAnnexResult} from "@/parser/llms/analyzer/annex_analyzer";
import {analyzeMainResolution} from "@/parser/llms/analyzer/main_resolution_analyzer";

import {validateReferenceConsistency} from "@/parser/llms/analyzer/reference_consistency";
import {LLMConsistencyValidationError} from "@/parser/llms/errors";
import {withLlmConsistencyRetry} from "@/util/llm/retries";
import ProgressReporter from "@/util/progress-reporter";
import {validateAnalysisChangesTableReferences} from "@/parser/llms/validation/table_validator";
import {ResolutionReferencesAnalysis} from "@/parser/schemas/references/schemas";

function emptyReferenceAnalysis(resolution: ResolutionStructure): ResolutionReferencesAnalysis {
    return {
        annexes: resolution.annexes.map(annex => {
            if (annex.type === "TextOrTables") {
                return {
                    type: "TextOrTables" as const,
                    references: [],
                    number: annex.number
                }
            } else {
                return {
                    type: "WithArticles" as const,
                    articles: annex.articles.map(article => ({
                        number: article.number,
                        suffix: article.suffix,
                        references: []
                    })),
                    chapters: annex.chapters.map(chapter => ({
                        articles: chapter.articles.map(article => ({
                            number: article.number,
                            suffix: article.suffix,
                            references: []
                        }))
                    }))
                }
            }
        }),
        articles: resolution.articles.map(article => ({
            number: article.number,
            suffix: article.suffix,
            references: []
        })),
        recitals: resolution.recitals.map((recital, index) => ({
            number: index + 1,
            references: []
        })),
        considerations: resolution.considerations.map((consideration, index) => ({
            number: index + 1,
            references: []
        }))
    }
}


export async function analyzeFullResolution(resolution: ResolutionStructure, firstAttempt: boolean, reporter: ProgressReporter): Promise<ResultWithData<FullResolutionAnalysis, ParseResolutionError>> {
    const mainResolutionReporter = reporter.addSubreporter("analyzeMainResolution", 60);
    const annexesReporter = reporter.addSubreporter("analyzeAnnexes", 7.85);
    const tablesReporter = reporter.addSubreporter("analyzeTables", 13.75);
    const referencesReporter = reporter.addSubreporter("analyzeReferences", 30);

    const mainAnalysisRes = await analyzeMainResolution(resolution, firstAttempt);
    if (!mainAnalysisRes.success) {
        return mainAnalysisRes;
    }
    const mainResolutionAnalysis = mainAnalysisRes.data;
    mainResolutionReporter.reportProgress(1);

    const annexPromises = resolution.annexes.map((annex, index) =>
        analyzeAnnex({
            resolutionArticles: resolution.articles,
            annex,
            annexNumber: index + 1,
            recitals: resolution.recitals,
            considerations: resolution.considerations,
            resolutionId: resolution.id,
            metadata: mainResolutionAnalysis.metadata
        }, firstAttempt)
    );
    const tableAnalysisPromise = analyze_tables(resolution.tables, firstAttempt);
    const tableAnalysis = await tableAnalysisPromise;
    tablesReporter.reportProgress(1);

    const annexResults: ParseAnnexResult[] = []
    for (let i = 0; i < annexPromises.length; i++) {
        const annexResult = await annexPromises[i]!;
        annexesReporter.reportProgress((i + 1) / annexPromises.length);
        annexResults.push(annexResult);
    }
    annexesReporter.reportProgress(1);

    const firstFailed = annexResults.find(result => !result.success);
    if (firstFailed !== undefined) {
        return firstFailed;
    }

    const annexes = annexResults.map(result => (result as typeof result & { success: true }).data);

    let totalArticles = resolution.articles.length;
    resolution.annexes.forEach((annex) => {
        if (annex.type === "WithArticles") {
            totalArticles += annex.articles.length;
            annex.chapters.forEach(chapter => {
                totalArticles += chapter.articles.length;
            })
        }
    });

    let referenceAnalysisResult: ResolutionReferencesAnalysis;

    try {
        referenceAnalysisResult = await withLlmConsistencyRetry(async (ctx) => {
            const referenceAnalysisPromise = extractReferences(resolution, firstAttempt && ctx.attempt === 1);
            const referenceAnalysisResult = await referenceAnalysisPromise;
            const consistencyValidationRes = validateReferenceConsistency(mainResolutionAnalysis, annexes, referenceAnalysisResult);
            if (!consistencyValidationRes.success) {
                console.error(JSON.stringify(consistencyValidationRes.error));
                throw new LLMConsistencyValidationError(consistencyValidationRes.error);
            }
            referencesReporter.reportProgress(1);
            return referenceAnalysisResult;
        })
    } catch (e) {
        if (totalArticles > 25) {
            referenceAnalysisResult = emptyReferenceAnalysis(resolution);
        } else
            throw e;
    }


    const analysis = merge({
        ...mainResolutionAnalysis,
        annexes: annexes,
        tables: tableAnalysis
    }, referenceAnalysisResult);

    const changeTableErrors = validateAnalysisChangesTableReferences(resolution, analysis);
    if (changeTableErrors.length > 0) {
        throw new LLMConsistencyValidationError(`Inconsistent table references in analysis changes: ${changeTableErrors.join(", ")}`);
    }

    return {
        success: true,
        data: analysis
    }
}