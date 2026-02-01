import IORedis from 'ioredis';

if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not defined");
}

const redisUrl = process.env.REDIS_URL;

// Standard connection for Clients (Queues, Scripts, Web)
export const redisConnection = new IORedis(redisUrl, {
    maxRetriesPerRequest: 5,
    lazyConnect: true
});

// Specific connection for BullMQ Workers
export const workerConnection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    lazyConnect: true
});