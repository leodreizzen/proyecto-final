import "server-only";
import {UIMessage} from "ai";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL!, {lazyConnect: true});
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
