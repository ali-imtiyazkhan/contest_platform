import { Router } from "express";
import { userMiddleware } from "../middleware/user";
import { client, SubmissionStatus, DuelStatus } from "db/client";
import { inviteDuelSchema, acceptDuelSchema, submitDuelSchema } from "../schemas/duel";

const router = Router();

// Get available challenges for duels
router.get("/challenges", userMiddleware, async (req, res) => {
    try {
        const challenges = await client.challenge.findMany({
            where: {
                contextStatus: "Completed"
            },
            select: {
                id: true,
                title: true,
                category: true,
                maxPoints: true,
                duration: true
            }
        });
        res.json({ ok: true, data: challenges });
    } catch (error) {
        console.error("Fetch challenges error:", error);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});

// Invite a user to a duel
router.post("/invite", userMiddleware, async (req: any, res) => {
    try {
        const result = inviteDuelSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ ok: false, message: result.error.issues[0].message });
        }

        const { player2Id, challengeId } = result.data;
        const player1Id = req.userId;

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
        const result = acceptDuelSchema.safeParse(req.params);
        if (!result.success) {
            return res.status(400).json({ ok: false, message: result.error.issues[0].message });
        }

        const { duelId } = result.data;
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
        const result = submitDuelSchema.safeParse({ ...req.params, ...req.body });
        if (!result.success) {
            return res.status(400).json({ ok: false, message: result.error.issues[0].message });
        }

        const { duelId, submission } = result.data;
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
                status: "Pending"
            }
        });


        res.status(201).json({ ok: true, data: sub });
    } catch (error) {
        console.error("Duel submit error:", error);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});

router.get("/my", userMiddleware, async (req: any, res) => {
    try {
        const userId = req.userId;
        const duels = await client.duel.findMany({
            where: {
                OR: [{ player1Id: userId }, { player2Id: userId }]
            },
            include: {
                player1: { select: { id: true, displayName: true, email: true, avatarColor: true } },
                player2: { select: { id: true, displayName: true, email: true, avatarColor: true } },
                challenge: true
            },
            orderBy: { createdAt: "desc" }
        });

        res.json({ ok: true, data: duels });
    } catch (error) {
        console.error("Get my duels error:", error);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});

// Get all duels (for lobby)
router.get("/", userMiddleware, async (req: any, res) => {
    try {
        const duels = await client.duel.findMany({
            include: {
                player1: { select: { id: true, displayName: true, email: true, avatarColor: true } },
                player2: { select: { id: true, displayName: true, email: true, avatarColor: true } },
                challenge: true
            },
            orderBy: { createdAt: "desc" },
            take: 20
        });

        res.json({ ok: true, data: duels });
    } catch (error) {
        console.error("Get all duels error:", error);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});

export default router;
