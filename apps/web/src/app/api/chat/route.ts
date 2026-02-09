import {
    streamText,
    convertToModelMessages,
    LanguageModel,
    stepCountIs,
    validateUIMessages, TypeValidationError, Tool, UIMessage
} from 'ai';
import {createOpenRouter} from '@openrouter/ai-sdk-provider';
import {createGoogleGenerativeAI} from '@ai-sdk/google';
import {authCheck, publicRoute} from "@/lib/auth/route-authorization";
import {chatbotSystemPrompt} from "@/lib/chatbot/system-prompt";
import {idLookupTool} from "@/lib/chatbot/tools/id-lookup";
import {searchTool} from "@/lib/chatbot/tools/search";
import {databaseInformationTool} from "@/lib/chatbot/tools/database-information";
import {z} from "zod";
import {loadChat, saveChat} from "@/lib/chatbot/chat-store";
import {v7} from "uuid";
import {chatLimiter, getIpAddress} from "@/lib/limiters";
import { cookies } from 'next/headers';
import {extendTokenExpiration, getTokenFromCookies} from "@/lib/chatbot/token";

let model: LanguageModel;
if (process.env.USE_OPENROUTER?.toLowerCase() === 'true') {
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY is not set in environment variables.');
    }
    model = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
    }).chat("google/gemini-3-flash-preview");
} else {
    if (!process.env.GOOGLE_API_KEY) {
        throw new Error('GOOGLE_API_KEY is not set in environment variables.');
    }
    model = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
    }).chat("gemini-3-flash-preview");
}


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
        model: model,
        messages: await convertToModelMessages(validatedMessages),
        system: chatbotSystemPrompt,
        tools: tools,
        stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse({
        originalMessages: validatedMessages,
        generateMessageId: () => v7(),
        onFinish: ({messages}) => {
            saveChat(id, messages, token)
        },
        headers: {
            'x-accel-buffering': 'no',
        }
    });

}