import { Router } from "express";
import { userMiddleware } from "../middleware/user";
import { client } from "db/client";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Create a new team
router.post("/", userMiddleware, async (req: any, res) => {
  try {
    const { name } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({ ok: false, message: "Team name is required" });
    }

    // Generate a unique 6-character invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const team = await client.team.create({
      data: {
        name,
        inviteCode,
        ownerId: userId,
        members: {
          create: { userId }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                avatarColor: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({ ok: true, data: team });
  } catch (error) {
    console.error("Create team error:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// Join a team via invite code
router.post("/join", userMiddleware, async (req: any, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.userId;

    if (!inviteCode) {
      return res.status(400).json({ ok: false, message: "Invite code is required" });
    }

    const team = await client.team.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() }
    });

    if (!team) {
      return res.status(404).json({ ok: false, message: "Team not found" });
    }

    // Check if already a member
    const existing = await client.teamMembership.findUnique({
      where: { teamId_userId: { teamId: team.id, userId } }
    });

    if (existing) {
      return res.status(400).json({ ok: false, message: "Already a member of this team" });
    }

    const membership = await client.teamMembership.create({
      data: { teamId: team.id, userId },
      include: { team: true }
    });

    res.json({ ok: true, data: membership });
  } catch (error) {
    console.error("Join team error:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// Get user's teams
router.get("/my", userMiddleware, async (req: any, res) => {
  try {
    const userId = req.userId;
    const teams = await client.team.findMany({
      where: {
        members: {
          some: { userId }
        }
      },
      include: {
        owner: {
          select: { id: true, displayName: true, email: true }
        },
        _count: {
          select: { members: true }
        }
      }
    });
    res.json({ ok: true, data: teams });
  } catch (error) {
    console.error("Get teams error:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// Get team details
router.get("/:teamId", userMiddleware, async (req: any, res) => {
  try {
    const { teamId } = req.params;
    const team = await client.team.findUnique({
      where: { id: teamId },
      include: {
        owner: {
          select: { id: true, displayName: true, email: true }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                avatarColor: true,
                rating: true
              }
            }
          }
        }
      }
    });

    if (!team) {
      return res.status(404).json({ ok: false, message: "Team not found" });
    }

    res.json({ ok: true, data: team });
  } catch (error) {
    console.error("Get team detail error:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

export default router;
