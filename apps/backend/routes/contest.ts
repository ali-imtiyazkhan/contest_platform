import { Router, Request } from "express";
import { userMiddleware } from "../middleware/user";
import { adminMiddleware } from "../middleware/admin";
import { client } from "db/client";
import {
  ContestCategory,
  Difficulty,
  SubmissionStatus,
} from "../../../packages/db/generated/prisma";
import { checkSubmissionRateLimit } from "../lib/redis";
import { aiQueue, submissionQueue } from "../lib/queue";

const router = Router();

//Helpers
function parsePagination(req: Request) {
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  return { offset, limit };
}

function toVerdict(
  status: SubmissionStatus | null | undefined,
  points: number,
  maxPoints: number,
): "full" | "partial" | "zero" | "judging" | "unattempted" {
  if (!status) return "unattempted";
  if (status === "Pending" || status === "Judging") return "judging";
  if (points >= maxPoints) return "full";
  if (points > 0) return "partial";
  return "zero";
}

// Admin
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
    if (!title || !startTime || !endTime)
      return res.status(400).json({ ok: false, message: "Missing fields" });

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

// create challenge
router.post("/admin/challenge", adminMiddleware, async (req, res) => {
  try {
    const { title, description, question, hint, maxPoints, duration, type } =
      req.body;
    if (!title || !question || isNaN(Number(maxPoints)))
      return res.status(400).json({ ok: false });

    const challenge = await client.challenge.create({
      data: {
        title,
        description,
        question,
        hint,
        maxPoints: Number(maxPoints),
        duration: Number(duration || 0),
        type: type as Difficulty,
        contextStatus: "Generating",
        aiContext: "",
      },
    });
    await aiQueue.add("generate-context", { challengeId: challenge.id });
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


// challenge details
router.post(
  "/admin/contest/:contestId/challenge",
  adminMiddleware,
  async (req, res) => {
    try {
      const { contestId } = req.params;
      const { challengeId, index } = req.body;
      const mapping = await client.contestToChallengeMapping.create({
        data: { contestId, challengeId, index: Number(index ?? 0) },
      });
      res.status(201).json({ ok: true, mapping });
    } catch (e: any) {
      if (e.code === "P2002") return res.status(409).json({ ok: false });
      res.status(500).json({ ok: false });
    }
  },
);

// Contest lists
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
    client.contest.count({ where: { startTime: { gt: now } } }),
  ]);
  res.json({ ok: true, data, pagination: { offset, limit, total } });
});


// active contests
router.get("/active", async (req, res) => {
  const { offset, limit } = parsePagination(req);
  const now = new Date();
  const [data, total] = await Promise.all([
    client.contest.findMany({
      where: { startTime: { lte: now }, endTime: { gte: now } },
      skip: offset,
      take: limit,
    }),
    client.contest.count({
      where: { startTime: { lte: now }, endTime: { gte: now } },
    }),
  ]);
  res.json({ ok: true, data, pagination: { offset, limit, total } });
});

// finished contests
router.get("/finished", async (req, res) => {
  const { offset, limit } = parsePagination(req);
  const now = new Date();
  const [data, total] = await Promise.all([
    client.contest.findMany({
      where: { endTime: { lt: now } },
      skip: offset,
      take: limit,
    }),
    client.contest.count({ where: { endTime: { lt: now } } }),
  ]);
  res.json({ ok: true, data, pagination: { offset, limit, total } });
});

// Contest detail
router.get("/:contestId", userMiddleware, async (req: any, res) => {
  const { contestId } = req.params;
  const userId = req.userId;
  const contest = await client.contest.findUnique({
    where: { id: contestId },
    include: {
      contestToChallengeMapping: {
        include: { challenge: true },
        orderBy: { index: "asc" },
      },
    },
  });
  if (!contest) return res.status(404).json({ ok: false });
  const membership = await client.contestParticipant.findUnique({
    where: { contestId_userId: { contestId, userId } },
  });
  return res.json({
    ok: true,
    data: { ...contest, isRegistered: !!membership },
  });
});


// check registration
router.get(
  "/:contestId/check-registration",
  userMiddleware,
  async (req: any, res) => {
    try {
      const { contestId } = req.params;
      const userId = req.userId;
      const participant = await client.contestParticipant.findUnique({
        where: { contestId_userId: { contestId, userId } },
      });
      res.json({ ok: true, isRegistered: !!participant });
    } catch (error) {
      console.error(error);
      res.status(500).json({ ok: false, isRegistered: false });
    }
  },
);

// register to contest
router.post("/:contestId/register", userMiddleware, async (req: any, res) => {
  try {
    const { contestId } = req.params;
    const userId = req.userId;
    const now = new Date();
    const contest = await client.contest.findUnique({
      where: { id: contestId },
    });
    if (!contest)
      return res.status(404).json({ ok: false, message: "Contest not found" });
    if (now > contest.endTime)
      return res.status(403).json({ ok: false, message: "Contest has ended" });
    await client.contestParticipant.create({ data: { contestId, userId } });
    return res.json({
      ok: true,
      alreadyRegistered: false,
      message: "Registered successfully",
    });
  } catch (error: any) {
    if (error.code === "P2002")
      return res.json({
        ok: true,
        alreadyRegistered: true,
        message: "Already registered",
      });
    return res.status(500).json({ ok: false });
  }
});

// Submit
router.post(
  "/:contestId/challenge/:challengeId/submit",
  userMiddleware,
  async (req: any, res) => {
    try {
      const { submission, aiApiKey } = req.body;
      const userId = req.userId;
      const { contestId, challengeId } = req.params;

      if (!submission)
        return res
          .status(400)
          .json({ ok: false, message: "Submission is required" });

      const allowed = await checkSubmissionRateLimit(userId);
      if (!allowed)
        return res.status(429).json({
          ok: false,
          message: "Too many submissions. Please slow down.",
        });

      const contest = await client.contest.findUnique({
        where: { id: contestId },
      });
      if (!contest)
        return res
          .status(404)
          .json({ ok: false, message: "Contest not found" });

      const now = new Date();
      if (now < contest.startTime)
        return res
          .status(403)
          .json({ ok: false, message: "Contest has not started yet" });

      const participant = await client.contestParticipant.findUnique({
        where: { contestId_userId: { contestId, userId } },
      });
      if (!participant)
        return res.status(403).json({
          ok: false,
          message: "You are not registered for this contest",
        });

      const mapping = await client.contestToChallengeMapping.findFirst({
        where: { contestId, challengeId },
      });
      if (!mapping)
        return res
          .status(404)
          .json({ ok: false, message: "Challenge not found in contest" });

      const submissionRecord = await client.contestSubmission.upsert({
        where: {
          contestToChallengeMappingId_userId: {
            contestToChallengeMappingId: mapping.id,
            userId,
          },
        },
        update: { submission, status: "Pending" },
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

//Result
router.get(
  "/:contestId/challenge/:challengeId/result",
  userMiddleware,
  async (req: any, res) => {
    try {
      const { contestId, challengeId } = req.params;
      const userId = req.userId;
      const mapping = await client.contestToChallengeMapping.findFirst({
        where: { contestId, challengeId },
      });
      if (!mapping)
        return res
          .status(404)
          .json({ ok: false, message: "Challenge not in contest" });

      const submission = await client.contestSubmission.findUnique({
        where: {
          contestToChallengeMappingId_userId: {
            contestToChallengeMappingId: mapping.id,
            userId,
          },
        },
        include: {
          contestToChallengeMapping: { include: { challenge: true } },
        },
      });
      if (!submission)
        return res
          .status(404)
          .json({ ok: false, message: "No submission found" });

      return res.json({
        ok: true,
        data: {
          status: submission.status,
          score: submission.points,
          maxPoints: submission.contestToChallengeMapping.challenge.maxPoints,
          aiVerdict: submission.aiVerdict,
          aiReason: submission.aiReason,
          submittedAt: submission.createdAt,
          updatedAt: submission.updatedAt,
          verdict: toVerdict(
            submission.status,
            submission.points,
            submission.contestToChallengeMapping.challenge.maxPoints,
          ),
        },
      });
    } catch (error) {
      console.error("Error fetching submission result:", error);
      res.status(500).json({ ok: false, message: "Internal server error" });
    }
  },
);

// leaderboard of a contest
router.get("/:contestId/leaderboard", async (req, res) => {
  try {
    const { contestId } = req.params;
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));

    // Challenges in this contest
    const mappings = await client.contestToChallengeMapping.findMany({
      where: { contestId },
      include: { challenge: true },
      orderBy: { index: "asc" },
    });

    if (mappings.length === 0) {
      return res.json({
        ok: true,
        challenges: [],
        leaderboard: [],
        recentSolves: [],
        stats: {
          totalParticipants: 0,
          avgScorePct: 0,
          topScore: 0,
          maxPossible: 0,
          fullSolveCount: 0,
        },
      });
    }

    const challenges = mappings.map((m) => ({
      id: m.challenge.id,
      _mappingId: m.id,
      title: m.challenge.title,
      maxPoints: m.challenge.maxPoints,
      index: m.index,
    }));

    const maxPossible = challenges.reduce((s, c) => s + c.maxPoints, 0);
    const mappingIds = mappings.map((m) => m.id);

    // Top N leaderboard entries, score desc
    const entries = await client.leaderboard.findMany({
      where: { contestId },
      orderBy: { score: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            country: true,
            avatarColor: true,
            rating: true,
          },
        },
      },
    });

    if (entries.length === 0) {
      return res.json({
        ok: true,
        challenges: challenges.map(({ _mappingId: _, ...c }) => c),
        leaderboard: [],
        recentSolves: [],
        stats: {
          totalParticipants: 0,
          avgScorePct: 0,
          topScore: 0,
          maxPossible,
          fullSolveCount: 0,
        },
      });
    }

    const userIds = entries
      .map((e) => e.userId)
      .filter((id): id is string => id !== null);

    //All submission
    const allSubs = await client.contestSubmission.findMany({
      where: {
        userId: { in: userIds },
        contestToChallengeMappingId: { in: mappingIds },
      },
      include: {
        contestToChallengeMapping: {
          select: { challengeId: true },
        },
      },
    });

    type Sub = (typeof allSubs)[number];
    const subIndex = new Map<string, Sub>();
    for (const s of allSubs) {
      subIndex.set(`${s.userId}:${s.contestToChallengeMapping.challengeId}`, s);
    }

    //Enrich each row
    const leaderboard = entries.map((entry, i) => {
      const challengeScores = challenges.map((ch) => {
        const sub = subIndex.get(`${entry.userId}:${ch.id}`);
        return {
          challengeId: ch.id,
          title: ch.title,
          maxPoints: ch.maxPoints,
          awarded: sub?.points ?? 0,
          // raw status sent so frontend can show "Pending" badge if desired
          status: (sub?.status ?? null) as SubmissionStatus | null,
          verdict: toVerdict(sub?.status, sub?.points ?? 0, ch.maxPoints),
          submittedAt: sub?.createdAt?.toISOString() ?? null,
          updatedAt: sub?.updatedAt?.toISOString() ?? null,
        };
      });

      // Earliest accepted submission → shown as "First solve"
      const acceptedTimestamps = allSubs
        .filter((s) => s.userId === entry.userId && s.status === "Accepted")
        .map((s) => s.createdAt.getTime());
      const firstSolveAt =
        acceptedTimestamps.length > 0
          ? new Date(Math.min(...acceptedTimestamps)).toISOString()
          : null;

      // Most recent activity (updatedAt from newest submission)
      const userSubTimestamps = allSubs
        .filter((s) => s.userId === entry.userId && s.updatedAt != null)
        .map((s) => s.updatedAt!.getTime());
      const lastActivityAt =
        userSubTimestamps.length > 0
          ? new Date(Math.max(...userSubTimestamps)).toISOString()
          : null;

      const scorePct =
        maxPossible > 0 ? Math.round((entry.score / maxPossible) * 100) : 0;

      return {
        rank: i + 1,
        userId: entry.userId,
        email: entry.user?.email || "",
        displayName: entry.user?.displayName ?? null,
        country: entry.user?.country ?? null,
        avatarColor: entry.user?.avatarColor || "#000000",
        rating: entry.user?.rating || 0,
        totalScore: entry.score,
        maxPossible,
        scorePct,
        challengeScores,
        firstSolveAt,
        lastActivityAt,
      };
    });

    // Recent solves in the last 60 s → live toast notifications
    const oneMinuteAgo = new Date(Date.now() - 60_000);
    const recentSolveRecords = await client.contestSubmission.findMany({
      where: {
        contestToChallengeMappingId: { in: mappingIds },
        status: "Accepted",
        updatedAt: { gte: oneMinuteAgo },
      },
      orderBy: { updatedAt: "desc" },
      take: 15,
      select: {
        userId: true,
        points: true,
        updatedAt: true,
        contestToChallengeMapping: {
          select: { challenge: { select: { title: true } } },
        },
        user: {
          select: { email: true, displayName: true, avatarColor: true },
        },
      },
    });

    const recentSolves = recentSolveRecords.map((r) => ({
      userId: r.userId,
      email: r.user.email,
      displayName: r.user.displayName ?? null,
      avatarColor: r.user.avatarColor,
      challengeTitle: r.contestToChallengeMapping.challenge.title,
      points: r.points,
      solvedAt: r.updatedAt!.toISOString(),
    }));

    //Stats
    const totalParticipants = await client.leaderboard.count({
      where: { contestId },
    });
    const avgScorePct =
      leaderboard.length > 0
        ? Math.round(
            leaderboard.reduce((s, e) => s + e.scorePct, 0) /
              leaderboard.length,
          )
        : 0;
    const topScore = leaderboard[0]?.totalScore ?? 0;
    const fullSolveCount = leaderboard.filter((e) =>
      e.challengeScores.some((cs) => cs.verdict === "full"),
    ).length;

    return res.json({
      ok: true,
      challenges: challenges.map(({ _mappingId: _, ...c }) => c),
      leaderboard,
      recentSolves,
      stats: {
        totalParticipants,
        avgScorePct,
        topScore,
        maxPossible,
        fullSolveCount,
      },
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// activity feed
router.get("/:contestId/activity", async (req, res) => {
  try {
    const { contestId } = req.params;
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

    // Get recent registrations
    const registrations = await client.contestParticipant.findMany({
      where: { contestId },
      orderBy: { registeredAt: "desc" },
      take: limit,
      include: {
        user: { select: { displayName: true, email: true } },
      },
    });

    // Get recent submissions
    const mappings = await client.contestToChallengeMapping.findMany({
      where: { contestId },
      select: { id: true },
    });
    const mappingIds = mappings.map((m) => m.id);

    const submissions = await client.contestSubmission.findMany({
      where: { contestToChallengeMappingId: { in: mappingIds } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { displayName: true, email: true } },
        contestToChallengeMapping: {
          include: { challenge: { select: { title: true } } },
        },
      },
    });

    // Combine and sort
    const activity = [
      ...registrations.map((r) => ({
        type: "join",
        userName: r.user.displayName || r.user.email.split("@")[0],
        timestamp: r.registeredAt,
      })),
      ...submissions.map((s) => ({
        type: s.status === "Accepted" ? "solve" : "submit",
        userName: s.user.displayName || s.user.email.split("@")[0],
        challengeTitle: s.contestToChallengeMapping.challenge.title,
        points: s.points,
        timestamp: s.createdAt,
      })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    res.json({ ok: true, data: activity });
  } catch (error) {
    console.error("Activity error:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

export default router;
