import "server-only";
import {UIMessage} from "ai";
import {redis} from "@/lib/redis";

const CHAT_TTL = 60 * 60 * 24;

export async function loadChat(chatId: string): Promise<UIMessage[]> {
    const historyKey = `chat:${chatId}`;
    const rawHistory = await redis.get(historyKey);
    const history = rawHistory ? JSON.parse(rawHistory) : [];
    return history;
}

export async function saveChat(chatId: string, history: UIMessage[]) {
    const historyKey = `chat:${chatId}`;
    await redis.set(historyKey, JSON.stringify(history), 'EX', CHAT_TTL);
}
