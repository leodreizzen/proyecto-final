import {RateLimiterRedis} from "rate-limiter-flexible";
import {redis} from "@/lib/redis";

export function getIpAddress(req: Request): string | null {
    return req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
}

export const chatLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'chat-limit',
    points: 1,
    duration: 2,
});

