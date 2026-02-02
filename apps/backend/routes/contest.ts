import { Router, Request, Response } from "express";
import { userMiddleware } from "../middleware/user";
import { adminMiddleware } from "../middleware/admin";
import { client } from "db/client";

import { Type } from "../../../packages/db/generated/prisma";
import {
  addScoreToLeaderboard,
  getLeaderboard,
  checkSubmissionRateLimit,
} from "../lib/redis";

const router = Router();

function parsePagination(req: Request) {
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  return { offset, limit };
}

// CREATE CONTEST
router.post("/admin/contest", adminMiddleware, async (req, res) => {
  try {
    const { title, startTime, description, endTime } = req.body;

    if (!title || !startTime || !description || !endTime) {
      return res.status(400).json({ ok: false });
    }

    const contest = await client.contest.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
    });

    res.status(201).json({ ok: true, contest });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

//CREATE CHALLENGE
router.post("/admin/challenge", adminMiddleware, async (req, res) => {
  try {
    const { title, notionDocId, description, type } = req.body;
    const maxPoints = Number(req.body.maxPoints);

    if (!title || !notionDocId || !description || isNaN(maxPoints)) {
      return res.status(400).json({ ok: false });
    }

    if (!Object.values(Type).includes(type)) {
      return res.status(400).json({ ok: false, error: "Invalid type" });
    }

    const challenge = await client.challenge.create({
      data: { title, notionDocId, description, maxPoints, type },
    });

    res.status(201).json({ ok: true, challenge });
  } catch {
    res.status(500).json({ ok: false });
  }
});

//MAP CHALLENGE TO CONTEST
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

// REORDER
router.put(
  "/admin/contest/:contestId/reorder",
  adminMiddleware,
  async (req, res) => {
    try {
      const { contestId } = req.params;
      const { orders } = req.body;

      const tx = orders.map((o: any) =>
        client.contestToChallengeMapping.updateMany({
          where: { contestId, challengeId: o.challengeId },
          data: { index: o.index },
        }),
      );

      await client.$transaction(tx);
      res.json({ ok: true });
    } catch {
      res.status(500).json({ ok: false });
    }
  },
);

// REMOVE CHALLENGE
router.delete(
  "/admin/contest/:contestId/challenge/:challengeId",
  adminMiddleware,
  async (req, res) => {
    await client.contestToChallengeMapping.deleteMany({
      where: req.params,
    });
    res.json({ ok: true });
  },
);

// ALL CONTESTS
router.get("/", async (_, res) => {
  const contests = await client.contest.findMany({
    orderBy: { startTime: "desc" },
  });
  res.json({ ok: true, data: contests });
});

// ACTIVE CONTESTS
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
      orderBy: { startTime: "desc" },
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

// FINISHED CONTESTS
router.get("/finished", async (req, res) => {
  const { offset, limit } = parsePagination(req);
  const now = new Date();

  const [data, total] = await Promise.all([
    client.contest.findMany({
      where: { endTime: { lt: now } },
      skip: offset,
      take: limit,
      orderBy: { startTime: "desc" },
    }),
    client.contest.count({
      where: { endTime: { lt: now } },
    }),
  ]);

  res.json({ ok: true, data, pagination: { offset, limit, total } });
});

// CONTEST DETAIL
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

router.get("/:contestId/challenge/:challengeId", async (req, res) => {
  try {
    const mapping = await client.contestToChallengeMapping.findFirst({
      where: {
        contestId: req.params.contestId,
        challengeId: req.params.challengeId,
      },
      include: { challenge: true },
    });

    if (!mapping)
      return res.status(404).json({ ok: false, error: "Not found" });

    res.json({ ok: true, data: mapping });
  } catch (error) {
    console.error("Challenge fetch error:", error);
    res.status(500).json({ ok: false });
  }
});

// SUBMIT SOLUTION
router.post(
  "/:contestId/challenge/:challengeId/submit",
  userMiddleware,
  async (req: any, res) => {
    try {
      const { submission, points } = req.body;
      const userId = req.userId;
      const { contestId, challengeId } = req.params;

      if (!submission || typeof points !== "number") {
        return res.status(400).json({ ok: false });
      }

      const alllowed = await checkSubmissionRateLimit(userId);
      if (!alllowed) {
        return res.status(429).json({ ok: false });
      }

      const currentMapping = await client.contestToChallengeMapping.findFirst({
        where: { contestId, challengeId },
      });

      if (!currentMapping) return res.status(404).json({ ok: false });

      const prev = await client.contestSubmission.findUnique({
        where: {
          contestToChallengeMappingId_userId: {
            contestToChallengeMappingId: currentMapping.id,
            userId,
          },
        },
      });

      const prevPoints = prev?.points ?? 0;
      const diff = points - prevPoints;

      await client.contestSubmission.upsert({
        where: {
          contestToChallengeMappingId_userId: {
            contestToChallengeMappingId: currentMapping.id,
            userId,
          },
        },
        update: { submission, points },
        create: {
          submission,
          points,
          userId,
          contestToChallengeMappingId: currentMapping.id,
        },
      });

      await addScoreToLeaderboard(contestId, userId, diff);

      const nextMapping = await client.contestToChallengeMapping.findFirst({
        where: { contestId, index: { gt: currentMapping.index } },
        orderBy: { index: "asc" },
      });

      res.status(201).json({
        ok: true,
        nextChallengeId: nextMapping?.challengeId ?? null,
      });
    } catch {
      res.status(500).json({ ok: false });
    }
  },
);

//LEADERBOARD
router.get("/:contestId/leaderboard", async (req, res) => {
  try {
    const raw = await getLeaderboard(req.params.contestId);

    // get all userIds
    const userIds = raw.map((r) => r.userId);

    // fetch users from DB
    const users = await client.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    });

    // map id -> user
    const userMap = new Map(users.map((u) => [u.id, u]));

    // attach names
    const leaderboard = raw.map((r) => ({
      rank: r.rank,
      score: r.score,
      userId: r.userId,
      email: userMap.get(r.userId)?.email,
    }));

    res.json({ ok: true, leaderboard });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

export default router;
