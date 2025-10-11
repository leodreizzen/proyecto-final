import {Result} from "../types/results";
import graph from "@/lib/chatbot/graph";
import {AIMessage, HumanMessage} from "@langchain/core/messages";

export type AIResponse = {
    message: string,
    searches: string[];
}

export async function generateChatResponse({message, thread_id}: {message: string, thread_id: string}): Promise<Result<AIResponse, string>> {
    try {
        const res = await graph.invoke(
            {
                messages: [new HumanMessage(message)]
            }, {configurable: {thread_id}});
        const response = res.messages[res.messages.length - 1].text;
        const lastSearches = [];
        for(const message of res.messages.slice(0, -1).reverse()) {
            if (message instanceof AIMessage) {
                if(message.tool_calls && message.tool_calls.length > 0) {
                    for(const call of message.tool_calls.slice().reverse()) {
                        if(call.name == "buscar_normativa") {
                            lastSearches.push(call.args.query);
                        }
                    }
                }
                else {
                    break;
                }
            }
        }
        lastSearches.reverse();
        return {
            success: true,
            data: {
                message: response,
                searches: lastSearches
            }
        };
    } catch (error) {
        console.error("Error generating chat response:", JSON.stringify(error, null, 2));
        return {
            success: false,
            error: "Error generating chat response"
        };
    }
}