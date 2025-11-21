import {zodToLLMDescription} from "@/util/llm/zod_to_llm";
import {
    MainResolutionAnalysisResultSchema,
    ResolutionAnalysisLLMResult
} from "@/parser/schemas/analyzer/resolution/result";
import {ResolutionStructure} from "@/parser/schemas/structure_parser/schemas";
import {resolutionAnalyzerSystemPrompt} from "@/parser/llms/prompts/analyzer";
import {structuredLLMCall} from "@/util/llm/llm_structured";
import {LLMResponseValidationError} from "@/parser/llms/errors";
import {validateMainResolutionAnalysis} from "@/parser/llms/analyzer/analysis_validations";
import {ResultWithData} from "@/definitions";
import {ParseResolutionError} from "@/parser/types";
import {MainResolutionAnalysis} from "@/parser/schemas/analyzer/resolution/resolution";

const resolutionSchemaDescription = zodToLLMDescription(MainResolutionAnalysisResultSchema);


export type AnalyzeResolutionResult = ResultWithData<MainResolutionAnalysis, ParseResolutionError>


function isParseResultValid(res: ResolutionAnalysisLLMResult): res is AnalyzeResolutionResult & ResolutionAnalysisLLMResult {
    if (res.success) return true;
    return res.error.code !== "other_error";
}

export async function analyzeMainResolution(resolution: ResolutionStructure): Promise<AnalyzeResolutionResult> {
    console.log("calling resolution analyzer model...");
    const {annexes, ...resolutionWithoutAnnexes} = resolution;
    const filteredAnnexes = filterAnnexes(annexes)

    const filteredResolution = {
        ...resolutionWithoutAnnexes,
        annexes: filteredAnnexes,
    }

    const resolutionJSON = JSON.stringify(filteredResolution, null, 2);
    const LLMResult = await structuredLLMCall({
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
        }, MainResolutionAnalysisResultSchema)

    if (!isParseResultValid(LLMResult)) {
        throw new LLMResponseValidationError(`Main resolution analyzer LLM call failed: ${LLMResult.error.message}`);
    }

    if(LLMResult.success) {
        const validationRes = validateMainResolutionAnalysis(LLMResult.data, resolution);
        if (!validationRes.success) {
            console.error(JSON.stringify(validationRes, null, 2));
            throw new LLMResponseValidationError(`Resolution analysis validation failed: ${validationRes.error}`);
        }
    }
    return LLMResult;
}


function cutText(text: string, length: number) {
    if (text.length > length) {
        return text.substring(0, length) + "...";
    }
    return text;

}

function filterAnnexes(annexes: ResolutionStructure["annexes"]) {
    return annexes.map(annex => {
        if (annex.type == "TextOrTables") {
            const {content, ...rest} = annex;
            return {...rest, content: cutText(content, 250)}
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
    });
}
