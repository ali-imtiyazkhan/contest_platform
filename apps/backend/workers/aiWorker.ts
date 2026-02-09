import { Worker } from "bullmq";
import IORedis from "ioredis";
import { client } from "db/client";
import { generateChallengeContext } from "../lib/ai/generateContext";

const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

new Worker(
  "aiQueue",
  async (job) => {
    const { challengeId } = job.data;

    const challenge = await client.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) return;

    try {
      const aiContext = await generateChallengeContext(
        challenge.description || "",
        challenge.maxPoints,
      );

      await client.challenge.update({
        where: { id: challengeId },
        data: {
          aiContext,
          contextStatus: "Completed",
        },
      });

      console.log("AI context generated:", challengeId);
    } catch (error) {
      console.error("AI generation failed:", error);

      await client.challenge.update({
        where: { id: challengeId },
        data: { contextStatus: "Failed" },
      });
    }
  },
  { connection },
);

console.log("AI Worker running...");
