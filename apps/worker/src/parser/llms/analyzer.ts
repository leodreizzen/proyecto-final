import {ResolutionStructure} from "@/parser/schemas/structure_parser/schemas";
import {zodToLLMDescription} from "@/util/llm/zod_to_llm";
import {ResolutionAnalysis} from "@/parser/schemas/analyzer/resolution/resolution";
import {parseLLMResponse} from "@/util/llm/llm_response";
import {LLMError, ResultWithData} from "@/definitions";
import {ResolutionAnalysisResultSchema} from "@/parser/schemas/analyzer/resolution/result";
import {ResolutionID} from "@/parser/schemas/common";
import {
    FullResolutionAnalysis,
} from "@/parser/types";
import {AnnexAnalysis} from "@/parser/schemas/analyzer/annexes/annex";
import {createOpenAICompletion} from "@/util/llm/openai_wrapper";
import {tableAnalyzer} from "@/parser/llms/table_analyzer";
import {extractReferences} from "@/parser/llms/reference_extractor";
import {merge} from "lodash-es";
import {AnnexAnalysisResultSchema} from "@/parser/schemas/analyzer/annexes/result";
import {TableAnalysis} from "@/parser/schemas/analyzer/tables/table";
import {AnnexStructure} from "@/parser/schemas/structure_parser/annex";
import {resolutionAnalyzerSystemPrompt, annexAnalyzerSystemPrompt} from "@/parser/llms/prompts/analyzer";

const resolutionSchemaDescription = zodToLLMDescription(ResolutionAnalysisResultSchema);

function cutText(text: string, length: number) {
    if (text.length > length) {
        return text.substring(0, length) + "...";
    }
    return text;

}

export async function analyzeResolution(resolution: ResolutionStructure): Promise<ResultWithData<FullResolutionAnalysis, LLMError>> {
    console.log("calling resolution analyzer model...");
    const {annexes, ...resolutionWithoutAnnexes} = resolution;
    const filteredAnnexes = annexes.map(annex => {
        if (annex.type == "TextOrTables") {
            const {content, ...rest} = annex;
            return {...rest, content: cutText(content, 100)}
        } else {
            const {articles, chapters, ...rest} = annex;
            return {
                ...rest,
                articles: articles.map(article => {
                    const {text, ...restArticle} = article;
                    return {...restArticle, text: cutText(text, 40)}
                }),
                chapters: chapters.map(chapter => ({
                    ...chapter,
                    articles: chapter.articles.map(article => {
                        const {text, ...restArticle} = article;
                        return {...restArticle, text: cutText(text, 40)}
                    })
                })),
            }
        }
    })

    const filteredResolution = {
        ...resolutionWithoutAnnexes,
        annexes: filteredAnnexes,
    }

    const resolutionJSON = JSON.stringify(filteredResolution, null, 2);
    let res
    try {
        res = await createOpenAICompletion({
            model: "gemini-2.5-flash",
            response_format: {
                type: "json_object"
            },
            reasoning_effort: "medium",
            max_completion_tokens: 64000,
            messages: [
                {
                    role: "developer",
                    content: [
                        {
                            type: "text",
                            text: resolutionAnalyzerSystemPrompt + resolutionSchemaDescription,
                            cache_control: {
                                type: "ephemeral"
                            }
                        }
                    ],
                },
                {
                    role: "user",
                    content: [{
                        type: "text",
                        text: resolutionJSON
                    }]
                }
            ]
        })
    } catch (e) {
        console.error("API error:", e);
        return {
            success: false,
            error: {code: "api_error"}
        };
    }
    const jsonParseRes = parseLLMResponse(res, ResolutionAnalysisResultSchema);
    if (!jsonParseRes.success) {
        return jsonParseRes
    }

    const LLMResult = jsonParseRes.data;
    if (LLMResult.success) {
        const resolutionAnalysis = LLMResult.data;

        const annexPromises = resolution.annexes.map((annex, index) =>
            analyzeAnnex({
                resolutionArticles: resolution.articles,
                annex,
                annexNumber: index + 1,
                recitals: resolution.recitals,
                considerations: resolution.considerations,
                resolutionId: resolution.id,
                metadata: resolutionAnalysis.metadata
            })
        );

        const referenceAnalysis = await extractReferences(resolution);
        if (!referenceAnalysis.success) {
            return referenceAnalysis;
        }

        const annexResults = await Promise.all(annexPromises);
        if (!annexResults.every(result => result.success)) {
            const firstError = annexResults.find(result => !result.success)?.error!;
            return {
                success: false,
                error: firstError
            };
        }
        let tableAnalysis = [] as TableAnalysis[];
        if (resolution.tables.length > 0) {
            const tableAnalysisRes = await tableAnalyzer(resolution.tables);

            if (!tableAnalysisRes.success) {
                console.error(JSON.stringify(tableAnalysisRes.error));
                return tableAnalysisRes;
            }

            tableAnalysis = tableAnalysisRes.data.result;
        }

        return {
            success: true,
            data: merge ({
                ...LLMResult.data,
                annexes: annexResults.map(result => result.data!),
                tables: tableAnalysis
            }, referenceAnalysis.data)
        }

    } else {
        return {
            success: false,
            error: {code: "llm_error", llmCode: LLMResult.error.code, llmMessage: LLMResult.error.message}
        };
    }
}

const annexSchemaDescription = zodToLLMDescription(AnnexAnalysisResultSchema);

type AnalyzeAnnexInput = {
    annex: AnnexStructure,
    annexNumber: number,
    resolutionArticles: ResolutionStructure["articles"],
    recitals: ResolutionStructure["recitals"],
    considerations: ResolutionStructure["considerations"],
    resolutionId: ResolutionID,
    metadata: ResolutionAnalysis["metadata"]
}

async function analyzeAnnex(input: AnalyzeAnnexInput): Promise<ResultWithData<AnnexAnalysis, LLMError>> {
    console.log("calling anenex analyzer model...");
    const annexJSON = JSON.stringify(input, null, 2);
    let res
    try {
        res = await createOpenAICompletion({
            model: "gemini-2.5-flash",
            response_format: {
                type: "json_object"
            },
            reasoning_effort: "medium",
            max_completion_tokens: 64000,
            messages: [
                {
                    role: "developer",
                    content: [
                        {
                            type: "text",
                            text: annexAnalyzerSystemPrompt + annexSchemaDescription,
                            cache_control: {
                                type: "ephemeral"
                            }
                        }
                    ],
                },
                {
                    role: "user",
                    content: [{
                        type: "text",
                        text: annexJSON
                    }]
                }
            ]
        })
    } catch (e) {
        console.error("API error:", e);
        return {
            success: false,
            error: {code: "api_error"}
        };
    }
    const jsonParseRes = parseLLMResponse(res, AnnexAnalysisResultSchema);
    if (!jsonParseRes.success) {
        return jsonParseRes
    }

    const LLMResult = jsonParseRes.data;
    if (LLMResult.success) {
        return {
            success: true,
            data: LLMResult.data
        }
    } else {
        return {
            success: false,
            error: {code: "llm_error", llmCode: LLMResult.error.code, llmMessage: LLMResult.error.message}
        };
    }
}
