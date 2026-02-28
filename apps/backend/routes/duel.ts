import { Router } from "express";
import { userMiddleware } from "../middleware/user";
import { client, SubmissionStatus, DuelStatus } from "db/client";

const router = Router();

// Invite a user to a duel
router.post("/invite", userMiddleware, async (req: any, res) => {
  try {
    const { player2Id, challengeId } = req.body;
    const player1Id = req.userId;

    if (!player2Id || !challengeId) {
      return res.status(400).json({ ok: false, message: "Missing player2Id or challengeId" });
    }

    if (player1Id === player2Id) {
      return res.status(400).json({ ok: false, message: "You cannot duel yourself" });
    }

    const duel = await client.duel.create({
      data: {
        player1Id,
        player2Id,
        challengeId,
        status: "Pending"
      },
      include: {
        player1: { select: { displayName: true, email: true, avatarColor: true } },
        player2: { select: { displayName: true, email: true, avatarColor: true } },
        challenge: true
      }
    });

    res.status(201).json({ ok: true, data: duel });
  } catch (error) {
    console.error("Duel invite error:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// Accept a duel invitation
router.post("/:duelId/accept", userMiddleware, async (req: any, res) => {
  try {
    const { duelId } = req.params;
    const userId = req.userId;

    const duel = await client.duel.findUnique({
      where: { id: duelId }
    });

    if (!duel) {
      return res.status(404).json({ ok: false, message: "Duel not found" });
    }

    if (duel.player2Id !== userId) {
      return res.status(403).json({ ok: false, message: "Unauthorized" });
    }

    if (duel.status !== "Pending") {
      return res.status(400).json({ ok: false, message: "Duel is not in pending state" });
    }

    const updatedDuel = await client.duel.update({
      where: { id: duelId },
      data: {
        status: "Active",
        startTime: new Date()
      },
      include: {
        player1: { select: { displayName: true, email: true } },
        player2: { select: { displayName: true, email: true } },
        challenge: true
      }
    });

    res.json({ ok: true, data: updatedDuel });
  } catch (error) {
    console.error("Duel accept error:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// Get duel status
router.get("/:duelId", userMiddleware, async (req: any, res) => {
  try {
    const { duelId } = req.params;
    const duel = await client.duel.findUnique({
      where: { id: duelId },
      include: {
        player1: { select: { id: true, displayName: true, email: true, avatarColor: true } },
        player2: { select: { id: true, displayName: true, email: true, avatarColor: true } },
        challenge: true,
        submissions: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!duel) {
      return res.status(404).json({ ok: false, message: "Duel not found" });
    }

    res.json({ ok: true, data: duel });
  } catch (error) {
    console.error("Get duel error:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// Submit a solution for a duel
router.post("/:duelId/submit", userMiddleware, async (req: any, res) => {
  try {
    const { duelId } = req.params;
    const { submission } = req.body;
    const userId = req.userId;

    const duel = await client.duel.findUnique({
      where: { id: duelId }
    });

    if (!duel || duel.status !== "Active") {
      return res.status(400).json({ ok: false, message: "Duel is not active" });
    }

    if (duel.player1Id !== userId && duel.player2Id !== userId) {
      return res.status(403).json({ ok: false, message: "Not a participant" });
    }

    const sub = await client.duelSubmission.create({
      data: {
        duelId,
        userId,
        submission,
        status: "Pending" // In a real app, this would trigger a judge worker
      }
    });

    // For demo/simplicity, we'll mark it as Accepted immediately if points are logic is mocked
    // In actual implementation, we'd use the same judge worker as contests
    
    res.status(201).json({ ok: true, data: sub });
  } catch (error) {
    console.error("Duel submit error:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

export default router;
