import { Queue } from "bullmq";
import IORedis from "ioredis";

// redis connection
const queueConnection = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : new IORedis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
    });

// submission queue
export const submissionQueue = new Queue("submissionQueue", {
  connection: queueConnection,
});

// ai queue
export const aiQueue = new Queue("aiQueue", {
  connection: queueConnection,
});
