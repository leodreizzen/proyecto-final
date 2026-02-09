import "server-only";
import {UIMessage} from "ai";
import {redis} from "@/lib/redis";
import {compareTokens, hashToken} from "@/lib/chatbot/token";

const CHAT_TTL = 60 * 60 * 24;

type SavedConversation = {
    tokenHash: string;
    messages: UIMessage[];
}

export async function loadChat(chatId: string, token: string): Promise<UIMessage[] | null> {
    const historyKey = `chat:${chatId}`;
    const rawHistory = await redis.get(historyKey);
    const history = rawHistory ? JSON.parse(rawHistory) as SavedConversation : null;

    if (!history) {
        return [];
    }
    if (!history.tokenHash) {
        return null; // basic type check
    }
    if (!await compareTokens(token, history.tokenHash)) {
        console.error("Token mismatch for chat history");
        return null;
    }
    return history.messages ?? null;
}

export async function saveChat(chatId: string, history: UIMessage[], token: string) {
    const historyKey = `chat:${chatId}`;

    const historyToSave: SavedConversation = {
        tokenHash: await hashToken(token),
        messages: history
    }

    await redis.set(historyKey, JSON.stringify(historyToSave), 'EX', CHAT_TTL);
}
