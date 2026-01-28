import { Router, Request, Response } from "express";
import { userMiddleware } from "../middleware/user";
import { client } from "db/client";
import {
  addScoreToLeaderboard,
  getLeaderboard,
  checkSubmissionRateLimit,
} from "../lib/redis";

const router = Router();

/* ================= Utils ================= */

function parsePagination(req: Request) {
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  return { offset, limit };
}

/* ================= ACTIVE CONTESTS ================= */
/**
 * Active contest = contest where current time is between startTime and endTime (if any)
 */
router.get("/active", async (req: Request, res: Response) => {
  try {
    const { offset, limit } = parsePagination(req);
    const now = new Date();

    const [contests, total] = await Promise.all([
      client.contest.findMany({
        where: {
          startTime: { lte: now },
        },
        skip: offset,
        take: limit,
        orderBy: { startTime: "desc" },
      }),
      client.contest.count({
        where: {
          startTime: { lte: now },
        },
      }),
    ]);

    return res.json({
      ok: true,
      data: contests,
      pagination: { offset, limit, total },
    });
  } catch (error) {
    console.error("Active contests error:", error);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to load contests" });
  }
});

/* ================= FINISHED CONTESTS ================= */
/**
 * Finished contest = startTime already passed AND no active submissions anymore
 * (You can later add endTime in schema if needed)
 */
router.get("/finished", async (req: Request, res: Response) => {
  try {
    const { offset, limit } = parsePagination(req);
    const now = new Date();

    const [contests, total] = await Promise.all([
      client.contest.findMany({
        where: {
          startTime: { lt: now },
        },
        skip: offset,
        take: limit,
        orderBy: { startTime: "desc" },
      }),
      client.contest.count({
        where: {
          startTime: { lt: now },
        },
      }),
    ]);

    return res.json({
      ok: true,
      data: contests,
      pagination: { offset, limit, total },
    });
  } catch (error) {
    console.error("Finished contests error:", error);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to load contests" });
  }
});

/* ================= LEADERBOARD ================= */
router.get("/leaderboard/:contestId", async (req: Request, res: Response) => {
  try {
    const { contestId } = req.params;

    // Verify contest exists
    const contestExists = await client.contest.findUnique({
      where: { id: contestId },
      select: { id: true },
    });

    if (!contestExists) {
      return res.status(404).json({ ok: false, error: "Contest not found" });
    }

    const leaderboard = await getLeaderboard(contestId);

    return res.json({
      ok: true,
      contestId,
      leaderboard,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to load leaderboard" });
  }
});

/* ================= CONTEST DETAILS ================= */
router.get(
  "/:contestId",
  userMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { contestId } = req.params;

      const contest = await client.contest.findUnique({
        where: { id: contestId },
        include: {
          contestToChallengeMapping: {
            include: {
              challenge: true,
            },
            orderBy: { index: "asc" },
          },
        },
      });

      if (!contest) {
        return res.status(404).json({ ok: false, error: "Contest not found" });
      }

      return res.json({ ok: true, data: contest });
    } catch (error) {
      console.error("Contest fetch error:", error);
      return res
        .status(500)
        .json({ ok: false, error: "Failed to load contest" });
    }
  },
);

/* ================= CHALLENGE DETAILS ================= */
router.get(
  "/:contestId/challenge/:challengeId",
  userMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { contestId, challengeId } = req.params;

      const mapping = await client.contestToChallengeMapping.findFirst({
        where: {
          contestId,
          challengeId,
        },
        include: {
          challenge: true,
        },
      });

      if (!mapping) {
        return res
          .status(404)
          .json({ ok: false, error: "Challenge not found in this contest" });
      }

      return res.json({ ok: true, data: mapping.challenge });
    } catch (error) {
      console.error("Challenge fetch error:", error);
      return res
        .status(500)
        .json({ ok: false, error: "Failed to load challenge" });
    }
  },
);

/* ================= SUBMIT SOLUTION ================= */
router.post(
  "/challenge/:challengeId/submit",
  userMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { challengeId } = req.params;
      const { submission, points } = req.body;
      const userId = (req as any).user.id;

      if (!submission || typeof points !== "number") {
        return res.status(400).json({
          ok: false,
          error: "submission and points are required",
        });
      }

      /* ---------- Rate Limit ---------- */
      const allowed = await checkSubmissionRateLimit(userId);
      if (!allowed) {
        return res.status(429).json({
          ok: false,
          error: "Too many submissions, slow down",
        });
      }

      /* ---------- Validate Challenge ---------- */
      const challenge = await client.challenge.findUnique({
        where: { id: challengeId },
      });

      if (!challenge) {
        return res
          .status(404)
          .json({ ok: false, error: "Challenge not found" });
      }

      /* ---------- Store Submission ---------- */
      const savedSubmission = await client.submissions.create({
        data: {
          submission,
          points,
          challengeId,
          userId,
        },
      });

      /* ---------- Find Contest Mapping ---------- */
      const mapping = await client.contestToChallengeMapping.findFirst({
        where: { challengeId },
        select: { contestId: true },
      });

      if (mapping) {
        await addScoreToLeaderboard(mapping.contestId, userId, points);
      }

      return res.status(201).json({
        ok: true,
        submission: savedSubmission,
      });
    } catch (error) {
      console.error("Submission error:", error);
      return res.status(500).json({ ok: false, error: "Submission failed" });
    }
  },
);

export default router;
