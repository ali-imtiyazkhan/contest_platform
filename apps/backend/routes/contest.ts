import { Router, Request, Response } from "express";
import { userMiddleware } from "../middleware/user";

const router = Router();

/* ================= ACTIVE CONTESTS ================= */
router.get("/active", async (req: Request, res: Response) => {
  try {
    const offset = Number(req.query.offset ?? 0);
    const limit = Number(req.query.page ?? 10);

    // TODO: Replace with DB query
    const contests = [];

    return res.json({
      ok: true,
      // data: contests,
      pagination: { offset, limit },
    });
  } catch (error) {
    console.error("Active contests error:", error);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ================= FINISHED CONTESTS ================= */
router.get("/finished", async (req: Request, res: Response) => {
  try {
    const offset = Number(req.query.offset ?? 0);
    const limit = Number(req.query.page ?? 10);

    // TODO: Replace with DB query
    // const contests = [];

    return res.json({
      ok: true,
      // data: contests,
      pagination: { offset, limit },
    });
  } catch (error) {
    console.error("Finished contests error:", error);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ================= CONTEST DETAILS ================= */
router.get(
  "/:contestId",
  userMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { contestId } = req.params;

      // TODO: Fetch contest + sub challenges from DB
      const contest = {
        id: contestId,
        name: "Demo Contest",
        startTime: new Date(),
        challenges: [],
      };

      return res.json({ ok: true, data: contest });
    } catch (error) {
      console.error("Contest fetch error:", error);
      return res.status(500).json({ ok: false, error: "Server error" });
    }
  },
);

/* ================= CHALLENGE DETAILS ================= */
router.get(
  "/:contestId/:challengeId",
  userMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { contestId, challengeId } = req.params;

      // TODO: Fetch challenge from DB
      const challenge = {
        id: challengeId,
        contestId,
        title: "Sample Challenge",
        description: "Solve this problem",
      };

      return res.json({ ok: true, data: challenge });
    } catch (error) {
      console.error("Challenge fetch error:", error);
      return res.status(500).json({ ok: false, error: "Server error" });
    }
  },
);

/* ================= LEADERBOARD ================= */
router.get("/leaderboard/:contestId", async (req: Request, res: Response) => {
  try {
    const { contestId } = req.params;

    // Temporary mock leaderboard (replace with DB / Redis later)
    const leaderboard = [
      { rank: 1, name: "Aditi Rao", score: 980 },
      { rank: 2, name: "Arjun Sharma", score: 930 },
      { rank: 3, name: "Maya Patel", score: 905 },
      { rank: 4, name: "Nikhil Nair", score: 880 },
    ];

    return res.json({
      ok: true,
      contestId,
      leaderboard,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ================= SUBMIT SOLUTION ================= */
router.post(
  "/submit/:challengeId",
  userMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { challengeId } = req.params;
      const { code, language } = req.body;
      const userId = (req as any).user?.id;

      if (!code || !language) {
        return res.status(400).json({
          ok: false,
          error: "Code and language are required",
        });
      }

      // TODO:
      // 1. Rate limit user (Redis)
      // 2. Send code to GPT / Judge
      // 3. Evaluate result
      // 4. Store submission in DB
      // 5. Update leaderboard sorted set

      const fakeResult = {
        passed: true,
        score: 10,
        executionTime: "120ms",
      };

      return res.json({
        ok: true,
        challengeId,
        userId,
        result: fakeResult,
      });
    } catch (error) {
      console.error("Submission error:", error);
      return res.status(500).json({ ok: false, error: "Server error" });
    }
  },
);

export default router;
