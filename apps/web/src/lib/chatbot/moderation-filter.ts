import {UIMessage} from "ai";
import {v7} from "uuid";

export function rejectLastAssistantMessage(messages: UIMessage[]): UIMessage[] {
    const lastAssistantMessage = messages.findLast(m => m.role === 'assistant');
    const newMessages = messages.filter(m => m.id !== lastAssistantMessage?.id);
    newMessages.push({
        role: "assistant",
        parts: [{
            type: "text",
            text: "Lo siento, pero no puedo responder a esa solicitud. Mejor hablemos de otra cosa."
        }],
        id: lastAssistantMessage?.id ?? v7(),
    } satisfies UIMessage)
    return newMessages;
}