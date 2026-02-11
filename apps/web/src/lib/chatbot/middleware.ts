import "server-only";
import {APICallError, generateText, LanguageModelMiddleware} from "ai";

import type {
    LanguageModelV3Message,
    LanguageModelV3Prompt,
    LanguageModelV3StreamPart,
} from '@ai-sdk/provider';
import {getModerationModel} from "@/lib/chatbot/models";
import {moderationSystemPrompt} from "@/lib/chatbot/system-prompt";
import crypto from "node:crypto";

export const llmModerationMiddleware: LanguageModelMiddleware = {
    specificationVersion: "v3",
    wrapStream: async ({doStream, params}) => {
        const {stream, request, response} = await doStream();

        let nextMessage = "";
        let startedId: string | null = null;
        let finished = false;
        let lastModeratedLength = 0;

        const transformStream = new TransformStream<LanguageModelV3StreamPart, LanguageModelV3StreamPart>({


            async transform(chunk, controller) {
                function markAsUnsafeAndFinish(controller: TransformStreamDefaultController<LanguageModelV3StreamPart>) {
                    if (startedId) {
                        if (startedId) {
                            controller.enqueue({
                                type: "text-end",
                                id: startedId,
                            })
                        }
                    }
                    controller.enqueue({
                        type: "finish",
                        finishReason: {
                            unified: "content-filter",
                            raw: "The conversation violated the content policy and was stopped.",
                        },
                        usage: {
                            inputTokens: {
                                total: undefined,
                                noCache: undefined,
                                cacheRead: undefined,
                                cacheWrite: undefined,
                            },
                            outputTokens: {
                                total: undefined,
                                text: undefined,
                                reasoning: undefined,
                            }
                        }
                    })
                    finished = true;
                    console.log("content filter triggered, terminating stream");
                    console.log("Unsafe message:" + nextMessage);
                    controller.terminate();
                }

                if (chunk.type === "text-delta") {
                    startedId = chunk.id;
                    nextMessage += chunk.delta;
                    if (nextMessage.length - lastModeratedLength >= 200) { // moderate every 200 new characters
                        if (!await moderateMessage(nextMessage, params.prompt, true)) {
                            markAsUnsafeAndFinish(controller);
                        }
                        lastModeratedLength = nextMessage.length;
                    }
                } else if (chunk.type === "text-end") {
                    startedId = null;
                    if (!await moderateMessage(nextMessage, params.prompt, false)) {
                        markAsUnsafeAndFinish(controller);
                    }
                }
                if (!finished) {
                    controller.enqueue(chunk);
                }
            }
        })

        return {
            stream: stream.pipeThrough(transformStream),
            request,
            response,
        }
    }
}

export async function moderateMessage(message: string, prompt: LanguageModelV3Prompt, partial: boolean): Promise<boolean> {
    const model = getModerationModel();
    if (!model)
        return true; // if no moderation model is configured, skip moderation

    const tagSuffix = crypto.randomBytes(4).toString("hex").slice(0, 8);

    const contentForModeration = formatContentForModeration(prompt, message, tagSuffix);
    const maxAttempts = 4;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const response = await generateText({
                model,
                system: moderationSystemPrompt(partial, tagSuffix),
                messages: [{
                    role: "user",
                    content: contentForModeration
                }]
            })

            if (response.text == "") {
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue //retry
            }
            const responseFormatted = response.text.trim().toUpperCase();
            if (responseFormatted !== "SAFE")
                console.log("Moderation response:" + response.text);
            if (responseFormatted === "SAFE"){
                return true;
            }
            else if (responseFormatted === "UNSAFE") {
                return false
            }
            // else retry
        } catch (error) {
            console.error("Error during moderation:", error);
            if (APICallError.isInstance(error) && error.statusCode === 429 && attempt === maxAttempts - 1) {
                console.warn("Rate limit hit during moderation on last attempt, treating content as safe to avoid false positives due to moderation unavailability.");
                return true;
            }

        }
    }

    console.error("Moderation failed after multiple attempts, treating content as safe.");

    return false;
}

function formatContentForModeration(prompt: LanguageModelV3Prompt, message: string, tagSuffix: string): string {
    let content = "Clasifica este contenido en SAFE o UNSAFE en base a tus instrucciones"
    content += `<conversation_history-${tagSuffix}>\n`;

    prompt.forEach(msg => {
        if (msg.role === "system") {
            content += `<system-${tagSuffix}>${formatMessageForModeration(msg.content, tagSuffix)}</system-${tagSuffix}>\n`;
        } else if (msg.role === "user") {
            content += `<user-${tagSuffix}>${formatMessageForModeration(msg.content, tagSuffix)}</user-${tagSuffix}>\n`;
        } else if (msg.role === "assistant") {
            content += `<assistant-${tagSuffix}>${formatMessageForModeration(msg.content, tagSuffix)}</assistant-${tagSuffix}>\n`;
        }
    })
    content += `</conversation_history-${tagSuffix}>`;

    content += "<generated_response-${tagSuffix}>"
    content += escapeTextForModeration(message);
    content += "</generated_response-${tagSuffix}>"

    return content
}

function escapeTextForModeration(message: string): string {
    return message.replace(/[<>]/g, (char) => {
        switch (char) {
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            default:
                return char;
        }
    });
}

function formatMessageForModeration(content: LanguageModelV3Message["content"], tagSuffix: string): string {
    let res = "";

    function processPart(part: LanguageModelV3Message["content"][number]): string {
        if (typeof part === "string") {
            return escapeTextForModeration(part);
        }

        switch (part.type) {
            case "reasoning":
                return `<reasoning-${tagSuffix}>${escapeTextForModeration(part.text)}</reasoning-${tagSuffix}>`;
            case "text":
                return `<text-${tagSuffix}>${escapeTextForModeration(part.text)}</text-${tagSuffix}>`;
            case "tool-call":
                return `<tool-call-${tagSuffix} name="${part.toolName}">${escapeTextForModeration(JSON.stringify(part.input))}</tool-call-${tagSuffix}>`;
            case "tool-result":
                return `<tool-output-${tagSuffix} name="${part.toolName}">${escapeTextForModeration(JSON.stringify(part.output))}</tool-output-${tagSuffix}>`;
            default:
                return `<unknown-${tagSuffix}>${escapeTextForModeration(JSON.stringify(part))}</unknown-${tagSuffix}>`;
        }
    }

    if (Array.isArray(content)) {
        content.forEach(part => {
            res += processPart(part);
        })
    } else {
        res += processPart(content);
    }
    return res;
}