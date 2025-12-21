import IORedis from "ioredis";
import {Queue} from "bullmq";

if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not defined");
}
const redisUrl = process.env.REDIS_URL;

export const redisConnection = new IORedis(redisUrl, {maxRetriesPerRequest: 5});

const assetsQueue = new Queue('assets', {connection: redisConnection});

assetsQueue.retryJobs({count: 1}).catch(console.error);