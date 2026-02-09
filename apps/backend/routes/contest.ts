import { Router, Request } from "express";
import { userMiddleware } from "../middleware/user";
import { adminMiddleware } from "../middleware/admin";
import { client } from "db/client";
import { Type } from "../../../packages/db/generated/prisma";
import { checkSubmissionRateLimit } from "../lib/redis";
import { generateChallengeContext } from "../lib/ai/generateContext";
import { submissionQueue } from "../lib/queue";

const router = Router();

function parsePagination(req: Request) {
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  return { offset, limit };
}

// create contest
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

// create challenge
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

    const aiContext = await generateChallengeContext(description, maxPoints);

    const challenge = await client.challenge.create({
      data: { title, notionDocId, aiContext, maxPoints, type, description },
    });

    res.status(201).json({ ok: true, challenge });
  } catch {
    res.status(500).json({ ok: false });
  }
});

// map b/w challenege and contest
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

// all contest
router.get("/", async (_, res) => {
  const contests = await client.contest.findMany({
    orderBy: { startTime: "desc" },
  });
  res.json({ ok: true, data: contests });
});

// upcoming contest
router.get("/upcoming", async (req, res) => {
  try {
    const { offset, limit } = parsePagination(req);
    const now = new Date();

    const [data, total] = await Promise.all([
      client.contest.findMany({
        where: {
          startTime: { gt: now },
        },
        skip: offset,
        take: limit,
        orderBy: { startTime: "asc" },
      }),
      client.contest.count({
        where: {
          startTime: { gt: now },
        },
      }),
    ]);

    res.json({
      ok: true,
      data,
      pagination: { offset, limit, total },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});
// active contest
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

// finished contest
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

// get contest detail
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

//Pre registration
router.post("/:contestId/register", userMiddleware, async (req: any, res) => {
  try {
    const { contestId } = req.params;
    const userId = req.userId;
    const now = new Date();

    const contest = await client.contest.findUnique({
      where: { id: contestId },
    });

    if (!contest) {
      return res.status(404).json({
        ok: false,
        message: "Contest not found",
      });
    }

    // Registration closes when contest starts
    if (now >= contest.startTime) {
      return res.status(403).json({
        ok: false,
        message: "Registration closed",
      });
    }

    // Create participant (unique constraint prevents duplicates)
    await client.contestParticipant.create({
      data: {
        contestId,
        userId,
      },
    });

    return res.json({
      ok: true,
      message: "Successfully registered",
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({
        ok: false,
        message: "Already registered",
      });
    }

    console.error(error);
    return res.status(500).json({
      ok: false,
      message: "Registration failed",
    });
  }
});

// upcoming contest
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
router.post(
  "/:contestId/challenge/:challengeId/submit",
  userMiddleware,
  async (req: any, res) => {
    try {
      const { submission } = req.body;
      const userId = req.userId;
      const { contestId, challengeId } = req.params;

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

      if (contest.endTime && now > contest.endTime) {
        return res.status(403).json({
          ok: false,
          message: "Contest has ended",
        });
      }

      if (!submission) {
        return res.status(400).json({ ok: false });
      }

      const allowed = await checkSubmissionRateLimit(userId);
      if (!allowed) {
        return res.status(429).json({ ok: false });
      }

      const currentMapping = await client.contestToChallengeMapping.findFirst({
        where: { contestId, challengeId },
        include: { challenge: true },
      });

      if (!currentMapping) {
        return res.status(404).json({ ok: false });
      }

      // CHANGE STARTS HERE — remove aiJudge + leaderboard logic

      const submissionRecord = await client.contestSubmission.upsert({
        where: {
          contestToChallengeMappingId_userId: {
            contestToChallengeMappingId: currentMapping.id,
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
          contestToChallengeMappingId: currentMapping.id,
          status: "Pending",
        },
      });

      // push job to queue
      await submissionQueue.add("judge", {
        submissionId: submissionRecord.id,
      });

      return res.status(201).json({
        ok: true,
        message: "Submission received. Judging in progress.",
      });

      // END OF CHANGE
    } catch (e) {
      console.error(e);
      res.status(500).json({ ok: false });
    }
  },
);

// leaderboard
router.get("/:contestId/leaderboard", async (req, res) => {
  try {
    const { contestId } = req.params;

    const entries = await client.leaderboard.findMany({
      where: { contestId },
      orderBy: [{ score: "desc" }, { userId: "asc" }],
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    const leaderboard = entries.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      email: entry.user.email,
      score: entry.score,
    }));

    res.json({ ok: true, leaderboard });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

export default router;
