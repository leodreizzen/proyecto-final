import {
    streamText,
    convertToModelMessages,
    stepCountIs,
    validateUIMessages, TypeValidationError, Tool, UIMessage, wrapLanguageModel
} from 'ai';
import {authCheck, publicRoute} from "@/lib/auth/route-authorization";
import {chatbotSystemPrompt} from "@/lib/chatbot/system-prompt";
import {idLookupTool} from "@/lib/chatbot/tools/id-lookup";
import {searchTool} from "@/lib/chatbot/tools/search";
import {databaseInformationTool} from "@/lib/chatbot/tools/database-information";
import {z} from "zod";
import {loadChat, saveChat} from "@/lib/chatbot/chat-store";
import {v7} from "uuid";
import {chatLimiter, getIpAddress} from "@/lib/limiters";
import {extendTokenExpiration, getTokenFromCookies} from "@/lib/chatbot/token";
import {llmModerationMiddleware} from "@/lib/chatbot/middleware";
import {rejectLastAssistantMessage} from "@/lib/chatbot/moderation-filter";
import {getChatbotModel} from "@/lib/chatbot/models";



const tools = {
    idLookup: idLookupTool,
    search: searchTool,
    databaseInformation: databaseInformationTool
}



export async function POST(req: Request) {
    await authCheck(publicRoute);
    const params = await req.json();
    const {message, id} = z.object({
        message: z.object().loose(),
        id: z.uuid(),
    }).parse(params);

    const ip = getIpAddress(req);
    if (ip) {
        try {
            await chatLimiter.consume(ip);
        } catch {
            return new Response('Too Many Requests', { status: 429 });
        }
    }

    const token = await getTokenFromCookies();

    if (!token) {
        console.error("No token found in cookies");
        return new Response('No conversation token. Start a new conversation', { status: 401 });
    }

    const history = await loadChat(id, token);

    if (!history) {
        return new Response('Conversation not found or token invalid. Start a new conversation', { status: 400 });
    }

    await extendTokenExpiration();

    let validatedMessages: UIMessage[];
    try {
        validatedMessages = await validateUIMessages({
            messages: [...history, message],
            tools: tools as { [x: string]: Tool<unknown, unknown> | undefined }
        })
    } catch (error) {
        if (error instanceof TypeValidationError) {
            console.error("Message validation error:", error);
            // try to validate with only the last message
            validatedMessages = validatedMessages = await validateUIMessages({
                messages: [message],
                tools: tools as { [x: string]: Tool<unknown, unknown> | undefined }
            })
            ;
        } else {
            console.error("Unexpected error during message validation:", error);
            throw error;
        }
    }


    const result = streamText({
        model: wrapLanguageModel({
            model: getChatbotModel(),
            middleware: llmModerationMiddleware
        }),
        messages: await convertToModelMessages(validatedMessages),
        system: chatbotSystemPrompt,
        tools: tools,
        stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse({
        originalMessages: validatedMessages,
        generateMessageId: () => v7(),
        onFinish: async ({messages, finishReason}) => {
            let messagesToSave = messages;
            if (finishReason === "content-filter") {
                messagesToSave = rejectLastAssistantMessage(messages);
            }
            await saveChat(id, messagesToSave, token)
        },
        headers: {
            'x-accel-buffering': 'no',
        }
    });

}