import OpenAI from "openai";
import {zodToLLMDescription} from "@/lib/parser/util/zod_to_llm";
import {ResolutionStructureSchema} from "@/lib/parser/v2/parser_schemas";
import {structureParserSystemPrompt} from "@/lib/parser/v2/prompt";

const openai = new OpenAI({
    apiKey: process.env.OPEN_ROUTER_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});

export async function parseResolutionStructure(fileContent: string) {
    const schemaDescription = zodToLLMDescription(ResolutionStructureSchema);
    console.log("calling model...");
    const res = await openai.chat.completions.create({
        model: "google/gemini-2.5-flash-lite",
        response_format: {
            type: "json_object"
        },
        reasoning_effort: "low",
        max_completion_tokens: 18000,
        messages: [
            {
                role: "developer",
                content: [
                    {
                        type: "text",
                        text: structureParserSystemPrompt + schemaDescription,
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
                    text: fileContent
                }]
            }
        ]
    });
    return res;
}
