import {mapArticleContentForLLM, mapResolutionForLLm} from "@/maintenance_tasks/advanced_changes/remapping";
import {AdvancedChangeResultSchema} from "@/maintenance_tasks/advanced_changes/schemas";
import {structuredLLMCall} from "@/util/llm/llm_structured";
import {advancedChangeSystemPrompt} from "@/maintenance_tasks/advanced_changes/prompt";
import {fetchChangesDataForAssembly} from "@repo/resolution-assembly";
import {zodToLLMDescription} from "@/util/llm/zod_to_llm";
import {z} from "zod";
import {retryCacheBuster, withLlmRetry} from "@/util/llm/retries";
import {LLMResponseValidationError} from "@/parser/llms/errors";

const advancedChangeSchemaDescription = zodToLLMDescription(AdvancedChangeResultSchema);
export type ArticleContentForLLM = ReturnType<typeof mapArticleContentForLLM>;
export type ResolutionContentForLLM = ReturnType<typeof mapResolutionForLLm>;
export type ChangesForLLM = Awaited<ReturnType<typeof fetchChangesDataForAssembly>>;


export type LLmAnalyzeAdvancedChangesResult =
    Extract<z.infer<typeof AdvancedChangeResultSchema>, { success: true }>
    | (Extract<z.infer<typeof AdvancedChangeResultSchema>, { success: false }> & {
    errorType: "ALREADY_APPLIED" | "CANT_APPLY"
})


export async function llmAnalyzeAdvancedChanges(articleContent: ArticleContentForLLM, targetResolution: ResolutionContentForLLM, otherChanges: ChangesForLLM, modifierResolution: ResolutionContentForLLM, firstAttempt: boolean): Promise<LLmAnalyzeAdvancedChangesResult> {
    return await withLlmRetry((ctx) => _llmAnalyzeAdvancedChanges(articleContent, targetResolution, otherChanges, modifierResolution, firstAttempt && ctx.attempt === 1));
}

export async function _llmAnalyzeAdvancedChanges(articleContent: ArticleContentForLLM, targetResolution: ResolutionContentForLLM, otherChanges: ChangesForLLM, modifierResolution: ResolutionContentForLLM, firstAttempt: boolean): Promise<LLmAnalyzeAdvancedChangesResult> {
    const changeJSON = JSON.stringify(articleContent, null, 2);
    const resolutionJSON = JSON.stringify(targetResolution, null, 2);
    const otherChangesJSON = JSON.stringify(otherChanges, null, 2);
    const modifierResolutionJSON = JSON.stringify(modifierResolution, null, 2);

    console.log("calling advanced change analyzer model...");
    const result = await structuredLLMCall({
        model: "gemini-3-flash-preview",
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
                        text: advancedChangeSystemPrompt + advancedChangeSchemaDescription,
                        cache_control: {
                            type: "ephemeral"
                        }
                    }
                ],
            },
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: `${retryCacheBuster(firstAttempt)}<textCambio>`
                    },
                    {
                        type: "text",
                        text: changeJSON
                    },
                    {
                        type: "text",
                        text: "</textoCambio><textoResolucionDestino>"
                    },
                    {
                        type: "text",
                        text: resolutionJSON
                    },
                    {
                        type: "text",
                        text: "</textoResolucionDestino> <textOtrosCambios>"
                    }, {
                        type: "text",
                        text: otherChangesJSON
                    },
                    {
                        type: "text",
                        text: "</textOtrosCambios>"
                    },
                    {
                        type: "text",
                        text: "<textoResolucionModificadora>"
                    },
                    {
                        type: "text",
                        text: modifierResolutionJSON
                    },
                    {
                        type: "text",
                        text: "</textoResolucionModificadora>"
                    }
                ]
            }]
    }, AdvancedChangeResultSchema);
    if (!result.success) {
        if (result.errorType === "OTHER")
            throw new LLMResponseValidationError("LLM advanced change analysis returned OTHER error: " + JSON.stringify(result, null, 2));
        return {
            success: false,
            errorType: result.errorType
        };
    }
    return result;
}