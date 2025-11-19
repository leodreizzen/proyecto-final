import {zodToLLMDescription} from "@/util/llm/zod_to_llm";
import {MainResolutionAnalysisResultSchema} from "@/parser/schemas/analyzer/resolution/result";
import {ResolutionStructure} from "@/parser/schemas/structure_parser/schemas";
import {LLMError, ResultWithData} from "@/definitions";
import {MainResolutionAnalysis} from "@/parser/schemas/analyzer/resolution/resolution";
import {createOpenAICompletion} from "@/util/llm/openai_wrapper";
import {resolutionAnalyzerSystemPrompt} from "@/parser/llms/prompts/analyzer";
import {parseLLMResponse} from "@/util/llm/llm_response";
import {validateMainResolutionAnalysis} from "@/parser/llms/analyzer/analysis_validations";

const resolutionSchemaDescription = zodToLLMDescription(MainResolutionAnalysisResultSchema);

export async function analyzeMainResolution(resolution: ResolutionStructure): Promise<ResultWithData<MainResolutionAnalysis, LLMError>> {
    console.log("calling resolution analyzer model...");
    const {annexes, ...resolutionWithoutAnnexes} = resolution;
    const filteredAnnexes = filterAnnexes(annexes)

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
    const parseRes = parseLLMResponse(res, MainResolutionAnalysisResultSchema);

    if (!parseRes.success) {
        return parseRes;
    }
    const LLMResult = parseRes.data;
    if (!LLMResult.success) {
        return {
            success: false,
            error: {code: "llm_error", llmCode: LLMResult.error.code, llmMessage: LLMResult.error.message}
        }
    }

    const validationRes = validateMainResolutionAnalysis(LLMResult.data, resolution);
    if (!validationRes.success) {
        console.error(JSON.stringify(validationRes, null, 2));
        return {
            success: false,
            error: {code: "validation_error"}
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
