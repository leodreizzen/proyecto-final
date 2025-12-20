import IORedis from "ioredis";

if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not defined");
}
const redisUrl = process.env.REDIS_URL;

const globalForRedis = globalThis as unknown as {
    redisPub?: IORedis;
    redisSub?: IORedis;
}

export const redisPublisher = globalForRedis.redisPub ?? (new IORedis(redisUrl, {maxRetriesPerRequest: 5}));
export const redisSubscriber = globalForRedis.redisSub ?? (new IORedis(redisUrl, {maxRetriesPerRequest: 5}));

