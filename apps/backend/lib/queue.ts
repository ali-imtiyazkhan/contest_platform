import { Queue } from "bullmq";
import IORedis from "ioredis";

const queueConnection = new IORedis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

export const submissionQueue = new Queue("submissionQueue", {
  connection: queueConnection,
});
