import { Worker } from "bullmq";
import IORedis from "ioredis";
import { client } from "db/client";
import { aiJudge } from "../lib/ai/aiJudge";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { GoogleGenAI } from "@google/genai";

const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

const io = new Server({
  adapter: createAdapter(connection, connection.duplicate()),
});

console.log("Judge Worker Started...");

new Worker(
  "submissionQueue",
  async (job) => {
    const { submissionId, aiApiKey } = job.data;

    console.log("Processing submission:", submissionId);

    if (!aiApiKey) {
      console.log("No API key provided");
      return;
    }

    // Basic key validation
    if (!aiApiKey.startsWith("AIza")) {
      console.log("Invalid API key format");
      return;
    }

    const submission = await client.contestSubmission.findUnique({
      where: { id: submissionId },
      include: {
        contestToChallengeMapping: {
          include: {
            challenge: true,
            contest: true,
          },
        },
      },
    });

    if (!submission) {
      console.log("Submission not found:", submissionId);
      return;
    }

    // Set status to Judging
    await client.contestSubmission.update({
      where: { id: submissionId },
      data: { status: "Judging" },
    });

    try {
      // Create dynamic AI instance (BYOK)
      const userKey = aiApiKey;
      const fallbackKey = process.env.GEMINI_API_KEY;

      let finalKey: string;

      if (userKey && userKey.startsWith("AIza")) {
        finalKey = userKey;
      } else {
        finalKey = fallbackKey!;
      }

      const ai = new GoogleGenAI({
        apiKey: finalKey,
      });

      const result = await aiJudge(
        submission.contestToChallengeMapping.challenge.aiContext!,
        submission.submission,
        submission.contestToChallengeMapping.challenge.maxPoints,
        ai,
      );

      const finalPoints = result.marks;
      const finalStatus = finalPoints > 0 ? "Accepted" : "Rejected";

      // Update submission
      await client.contestSubmission.update({
        where: { id: submissionId },
        data: {
          status: finalStatus,
          points: finalPoints,
          aiVerdict: result.verdict,
          aiReason: result.reason,
        },
      });

      // Calculate total score
      const total = await client.contestSubmission.aggregate({
        where: {
          userId: submission.userId,
          contestToChallengeMapping: {
            contestId: submission.contestToChallengeMapping.contestId,
          },
        },
        _sum: { points: true },
      });

      const totalScore = total._sum.points ?? 0;

      // Update leaderboard
      await client.leaderboard.upsert({
        where: {
          contestId_userId: {
            contestId: submission.contestToChallengeMapping.contestId,
            userId: submission.userId,
          },
        },
        update: { score: totalScore },
        create: {
          contestId: submission.contestToChallengeMapping.contestId,
          userId: submission.userId,
          score: totalScore,
        },
      });

      // Emit real-time update
      io.to(submission.userId).emit("submission:update", {
        submissionId: submission.id,
        status: finalStatus,
        points: finalPoints,
      });

      console.log("Submission processed:", submissionId);
    } catch (error) {
      console.error("AI Judge failed:", error);

      await client.contestSubmission.update({
        where: { id: submissionId },
        data: {
          status: "Rejected",
          aiReason: "AI judging failed",
        },
      });
    }
  },
  { connection },
);
