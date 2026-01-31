import { Router, Request, Response } from "express";
import { userMiddleware } from "../middleware/user";
import { adminMiddleware } from "../middleware/admin";
import { client } from "db/client";
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

// create contest
router.post("/admin/contest", async (req: Request, res: Response) => {
  try {
    const { title, startTime, description } = req.body;

    if (!title || !startTime || !description) {
      return res.status(400).json({
        ok: false,
        error: "title and startTime are required",
      });
    }

    const contest = await client.contest.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
      },
    });

    return res.status(201).json({ ok: true, contest });
  } catch (error) {
    console.error("Create contest error:", error);
    return res.status(500).json({ ok: false, error: "Create failed" });
  }
});

// create challenge
router.post("/admin/challenge", async (req: Request, res: Response) => {
  try {
    const { title, notionDocId, maxPoints, description } = req.body;

    if (
      !title ||
      !notionDocId ||
      typeof maxPoints !== "number" ||
      !description
    ) {
      return res.status(400).json({
        ok: false,
        error: "title, notionDocId,description and maxPoints are required",
      });
    }

    const challenge = await client.challenge.create({
      data: { title, notionDocId, description, maxPoints },
    });

    return res.status(201).json({ ok: true, challenge });
  } catch (error) {
    console.error("Create challenge error:", error);
    return res.status(500).json({ ok: false, error: "Create failed" });
  }
});

// map challenge to contest
router.post(
  "/admin/contest/:contestId/challenge",
  async (req: Request, res: Response) => {
    try {
      const { contestId } = req.params;
      const { challengeId, index } = req.body;

      if (!contestId || !challengeId) {
        return res.status(400).json({
          ok: false,
          error: "contestId and challengeId required",
        });
      }

      const [contest, challenge] = await Promise.all([
        client.contest.findUnique({ where: { id: contestId } }),
        client.challenge.findUnique({ where: { id: challengeId } }),
      ]);

      if (!contest || !challenge) {
        return res
          .status(404)
          .json({ ok: false, error: "Invalid contest or challenge" });
      }

      const mapping = await client.contestToChallengeMapping.create({
        data: {
          contestId,
          challengeId,
          index: Number(index ?? 0),
        },
      });

      return res.status(201).json({ ok: true, mapping });
    } catch (error: any) {
      if (error.code === "P2002") {
        return res.status(409).json({
          ok: false,
          error: "Challenge already mapped",
        });
      }
      console.error("Mapping error:", error);
      return res.status(500).json({ ok: false, error: "Mapping failed" });
    }
  },
);

// reorder challenege
router.put(
  "/admin/contest/:contestId/reorder",
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { contestId } = req.params;
      const { orders } = req.body as {
        orders: { challengeId: string; index: number }[];
      };

      if (!Array.isArray(orders)) {
        return res.status(400).json({
          ok: false,
          error: "orders array required",
        });
      }

      const tx = orders.map((o) =>
        client.contestToChallengeMapping.updateMany({
          where: { contestId, challengeId: o.challengeId },
          data: { index: o.index },
        }),
      );

      await client.$transaction(tx);

      return res.json({ ok: true });
    } catch (error) {
      console.error("Reorder error:", error);
      return res.status(500).json({ ok: false, error: "Reorder failed" });
    }
  },
);

// remove challenge from contest
router.delete(
  "/admin/contest/:contestId/challenge/:challengeId",
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { contestId, challengeId } = req.params;

      await client.contestToChallengeMapping.deleteMany({
        where: { contestId, challengeId },
      });

      return res.json({ ok: true });
    } catch (error) {
      console.error("Remove challenge error:", error);
      return res.status(500).json({ ok: false, error: "Delete failed" });
    }
  },
);

// all contest
router.get("/", async (req: Request, res: Response) => {
  try {
    const contests = await client.contest.findMany({
      orderBy: { startTime: "desc" },
    });

    res.json({ ok: true, data: contests });
  } catch (error) {
    console.error("contests error:", error);
    res.status(500).json({ ok: false, error: "Load failed" });
  }
});

// active contest
router.get("/active", async (req: Request, res: Response) => {
  try {
    const { offset, limit } = parsePagination(req);
    const now = new Date();

    const [data, total] = await Promise.all([
      client.contest.findMany({
        where: { startTime: { lte: now } },
        skip: offset,
        take: limit,
        orderBy: { startTime: "desc" },
      }),
      client.contest.count({ where: { startTime: { lte: now } } }),
    ]);

    res.json({ ok: true, data, pagination: { offset, limit, total } });
  } catch (error) {
    console.error("Active contests error:", error);
    res.status(500).json({ ok: false, error: "Load failed" });
  }
});

// finsished contset
router.get("/finished", async (req: Request, res: Response) => {
  try {
    const { offset, limit } = parsePagination(req);
    const now = new Date();

    const [data, total] = await Promise.all([
      client.contest.findMany({
        where: { startTime: { lt: now } },
        skip: offset,
        take: limit,
        orderBy: { startTime: "desc" },
      }),
      client.contest.count({ where: { startTime: { lt: now } } }),
    ]);

    res.json({ ok: true, data, pagination: { offset, limit, total } });
  } catch (error) {
    console.error("Finished contests error:", error);
    res.status(500).json({ ok: false, error: "Load failed" });
  }
});

// contest deatil
router.get("/:contestId", async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Contest fetch error:", error);
    res.status(500).json({ ok: false });
  }
});

// challenge details
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

// submit solution
// submit solution
router.post(
  "/:contestId/challenge/:challengeId/submit",
  userMiddleware,
  async (req, res) => {
    try {
      const { submission, points } = req.body;
      const userId = (req as any).userId;
      const { contestId, challengeId } = req.params;

      if (!submission || typeof points !== "number") {
        return res.status(400).json({ ok: false });
      }

      const allowed = await checkSubmissionRateLimit(userId);
      if (!allowed) return res.status(429).json({ ok: false });

      // 🔹 1. Find current mapping
      const currentMapping = await client.contestToChallengeMapping.findFirst({
        where: { contestId, challengeId },
      });

      if (!currentMapping) {
        return res
          .status(404)
          .json({ ok: false, error: "Invalid contest/challenge" });
      }

      // 🔹 2. Save submission
      await client.contestSubmission.upsert({
        where: {
          contestToChallengeMappingId_userId: {
            contestToChallengeMappingId: currentMapping.id,
            userId,
          },
        },
        update: {
          submission,
          points,
        },
        create: {
          submission,
          points,
          userId,
          contestToChallengeMappingId: currentMapping.id,
        },
      });

      // 🔹 3. Update leaderboard
      await addScoreToLeaderboard(contestId, userId, points);

      // 🔥🔥🔥 4. FIND NEXT CHALLENGE BY INDEX
      const nextMapping = await client.contestToChallengeMapping.findFirst({
        where: {
          contestId,
          index: { gt: currentMapping.index },
        },
        orderBy: { index: "asc" },
      });

      const nextChallengeId = nextMapping?.challengeId ?? null;

      // 🔥 FINAL RESPONSE
      res.status(201).json({
        ok: true,
        data: {
          nextChallengeId,
        },
      });
    } catch (error) {
      console.error("Submit error:", error);
      res.status(500).json({ ok: false });
    }
  },
);

// leaderboard
router.get("/leaderboard/:contestId", async (req, res) => {
  try {
    const leaderboard = await getLeaderboard(req.params.contestId);
    res.json({ ok: true, leaderboard });
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ ok: false });
  }
});

export default router;
