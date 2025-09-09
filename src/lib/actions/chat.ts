"use server";

import {Result} from "@/lib/types/results";
import {z} from "zod";
import {AIResponse, generateChatResponse} from "@/lib/chatbot/chat";

export async function sendChatMessageAction(params: {message: string, thread_id: string}): Promise<Result<AIResponse, string>> {
    const paramsParsed = z.object({
        message: z.string().min(1, "Message cannot be empty").max(500, "Message is too long"),
        thread_id: z.string().uuid("Invalid thread ID")
    }).safeParse(params);
    if(!paramsParsed.success){
        return {success: false, error: "Invalid data"};
    }
    else {
        return generateChatResponse(paramsParsed.data);
    }
}