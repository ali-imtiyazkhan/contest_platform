import { Worker } from "bullmq";
import IORedis from "ioredis";
import { client } from "db/client";
import { aiJudge } from "../lib/ai/aiJudge";

// Separate Redis connection for BullMQ
const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, 
});

console.log(" Judge Worker Started...");

new Worker(
  "submissionQueue",
  async (job) => {
    const { submissionId } = job.data;

    console.log("Processing submission:", submissionId);

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

    // Run AI Judge
    const ai = await aiJudge(
      submission.contestToChallengeMapping.challenge.aiContext!,
      submission.submission,
      submission.contestToChallengeMapping.challenge.maxPoints,
    );

    const finalPoints = ai.marks;

    // Update submission with result
    await client.contestSubmission.update({
      where: { id: submissionId },
      data: {
        status: finalPoints > 0 ? "Accepted" : "Rejected",
        points: finalPoints,
        aiVerdict: ai.verdict,
        aiReason: ai.reason,
      },
    });

    // Calculate total score for this contest
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

    console.log(" Submission processed:", submissionId);
  },
  { connection },
);
