import IORedis from 'ioredis';
if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not defined");
}
const redisUrl = process.env.REDIS_URL;

export const redisConnection = new IORedis(redisUrl,{ maxRetriesPerRequest: 5, lazyConnect: true });

