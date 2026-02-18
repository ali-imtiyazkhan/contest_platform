import { Router, Request } from "express";
import { userMiddleware } from "../middleware/user";
import { adminMiddleware } from "../middleware/admin";
import { client } from "db/client";
import {
  ContestCategory,
  Difficulty,
  Type,
} from "../../../packages/db/generated/prisma";
import { checkSubmissionRateLimit } from "../lib/redis";
import { aiQueue, submissionQueue } from "../lib/queue";

const router = Router();

function parsePagination(req: Request) {
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  return { offset, limit };
}

router.post("/admin/contest", adminMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      startTime,
      endTime,
      category,
      difficulty,
      prize,
      maxParticipants,
      host,
      tags,
    } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ ok: false, message: "Missing fields" });
    }

    const contest = await client.contest.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        category: category as ContestCategory,
        difficulty: difficulty as Difficulty,
        prize: Number(prize || 0),
        maxParticipants: Number(maxParticipants || 1000),
        host,
        tags: tags || [],
      },
    });

    res.status(201).json({ ok: true, contest });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

router.post("/admin/challenge", adminMiddleware, async (req, res) => {
  try {
    const { title, description, question, hint, maxPoints, duration, type } =
      req.body;

    if (!title || !question || isNaN(Number(maxPoints))) {
      return res.status(400).json({ ok: false });
    }

    const challenge = await client.challenge.create({
      data: {
        title,
        description,
        question,
        hint,
        maxPoints: Number(maxPoints),
        duration: Number(duration || 0),
        type: type as Type,
        contextStatus: "Generating",
        aiContext: "",
      },
    });

    await aiQueue.add("generate-context", {
      challengeId: challenge.id,
    });

    res.status(201).json({
      ok: true,
      challenge,
      message: "Challenge created. AI generation running.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

router.post(
  "/admin/contest/:contestId/challenge",
  adminMiddleware,
  async (req, res) => {
    try {
      const { contestId } = req.params;
      const { challengeId, index } = req.body;

      const mapping = await client.contestToChallengeMapping.create({
        data: {
          contestId,
          challengeId,
          index: Number(index ?? 0),
        },
      });

      res.status(201).json({ ok: true, mapping });
    } catch (e: any) {
      if (e.code === "P2002") return res.status(409).json({ ok: false });
      res.status(500).json({ ok: false });
    }
  },
);

router.get("/", async (_, res) => {
  const contests = await client.contest.findMany({
    orderBy: { startTime: "desc" },
  });
  res.json({ ok: true, data: contests });
});

router.get("/:contestId/participants/count", async (req, res) => {
  const count = await client.contestParticipant.count({
    where: { contestId: req.params.contestId },
  });
  res.json({ ok: true, count });
});

router.get("/upcoming", async (req, res) => {
  const { offset, limit } = parsePagination(req);
  const now = new Date();

  const [data, total] = await Promise.all([
    client.contest.findMany({
      where: { startTime: { gt: now } },
      skip: offset,
      take: limit,
      orderBy: { startTime: "asc" },
    }),
    client.contest.count({
      where: { startTime: { gt: now } },
    }),
  ]);

  res.json({ ok: true, data, pagination: { offset, limit, total } });
});

router.get("/active", async (req, res) => {
  const { offset, limit } = parsePagination(req);
  const now = new Date();

  const [data, total] = await Promise.all([
    client.contest.findMany({
      where: {
        startTime: { lte: now },
        endTime: { gte: now },
      },
      skip: offset,
      take: limit,
    }),
    client.contest.count({
      where: {
        startTime: { lte: now },
        endTime: { gte: now },
      },
    }),
  ]);

  res.json({ ok: true, data, pagination: { offset, limit, total } });
});

router.get("/finished", async (req, res) => {
  const { offset, limit } = parsePagination(req);
  const now = new Date();

  const [data, total] = await Promise.all([
    client.contest.findMany({
      where: { endTime: { lt: now } },
      skip: offset,
      take: limit,
    }),
    client.contest.count({
      where: { endTime: { lt: now } },
    }),
  ]);

  res.json({ ok: true, data, pagination: { offset, limit, total } });
});

router.get("/:contestId", async (req, res) => {
  const contest = await client.contest.findUnique({
    where: { id: req.params.contestId },
    include: {
      contestToChallengeMapping: {
        include: { challenge: true },
        orderBy: { index: "asc" },
      },
    },
  });

  if (!contest) return res.status(404).json({ ok: false });

  res.json({ ok: true, data: contest });
});

router.post("/:contestId/register", userMiddleware, async (req: any, res) => {
  try {
    const { contestId } = req.params;
    const userId = req.userId;
    const now = new Date();

    const contest = await client.contest.findUnique({
      where: { id: contestId },
    });

    if (!contest) return res.status(404).json({ ok: false });

    if (now >= contest.startTime)
      return res
        .status(403)
        .json({ ok: false, message: "Registration closed" });

    await client.contestParticipant.create({
      data: { contestId, userId },
    });

    res.json({ ok: true, message: "Registered" });
  } catch (error: any) {
    if (error.code === "P2002")
      return res.status(409).json({ ok: false, message: "Already registered" });

    res.status(500).json({ ok: false });
  }
});

router.post(
  "/:contestId/challenge/:challengeId/submit",
  userMiddleware,
  async (req: any, res) => {
    try {
      const { submission, aiApiKey } = req.body;
      const userId = req.userId;
      const { contestId, challengeId } = req.params;

      if (!submission) {
        return res.status(400).json({
          ok: false,
          message: "Submission is required",
        });
      }

      const allowed = await checkSubmissionRateLimit(userId);
      if (!allowed) {
        return res.status(429).json({
          ok: false,
          message: "Too many submissions. Please slow down.",
        });
      }

      const contest = await client.contest.findUnique({
        where: { id: contestId },
      });

      if (!contest) {
        return res.status(404).json({
          ok: false,
          message: "Contest not found",
        });
      }

      const now = new Date();

      if (now < contest.startTime) {
        return res.status(403).json({
          ok: false,
          message: "Contest has not started yet",
        });
      }

      if (now > contest.endTime) {
        return res.status(403).json({
          ok: false,
          message: "Contest has ended",
        });
      }

      const participant = await client.contestParticipant.findUnique({
        where: {
          contestId_userId: {
            contestId,
            userId,
          },
        },
      });

      if (!participant) {
        return res.status(403).json({
          ok: false,
          message: "You are not registered for this contest",
        });
      }

      const mapping = await client.contestToChallengeMapping.findFirst({
        where: { contestId, challengeId },
      });

      if (!mapping) {
        return res.status(404).json({
          ok: false,
          message: "Challenge not found in contest",
        });
      }

      const submissionRecord = await client.contestSubmission.upsert({
        where: {
          contestToChallengeMappingId_userId: {
            contestToChallengeMappingId: mapping.id,
            userId,
          },
        },
        update: {
          submission,
          status: "Pending",
        },
        create: {
          submission,
          userId,
          contestToChallengeMappingId: mapping.id,
          status: "Pending",
        },
      });

      await submissionQueue.add("judge", {
        submissionId: submissionRecord.id,
        aiApiKey,
      });

      return res.status(201).json({
        ok: true,
        message: "Submission received. Judging in progress.",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ ok: false });
    }
  },
);

router.get("/:contestId/leaderboard", async (req, res) => {
  const entries = await client.leaderboard.findMany({
    where: { contestId: req.params.contestId },
    orderBy: { score: "desc" },
    include: { user: { select: { email: true } } },
  });

  const leaderboard = entries.map((e, i) => ({
    rank: i + 1,
    userId: e.userId,
    email: e.user.email,
    score: e.score,
  }));

  res.json({ ok: true, leaderboard });
});

export default router;
