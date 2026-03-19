import { Router } from "express";
import { userMiddleware } from "../middleware/user";
import { client } from "db/client";

const router = Router();

// Helper: generate a unique 6-char invite code with collision retry
async function generateUniqueInviteCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const existing = await client.team.findUnique({ where: { inviteCode: code } });
    if (!existing) return code;
  }
  // Fallback: use timestamp-based code
  return Date.now().toString(36).substring(0, 6).toUpperCase();
}

const MAX_TEAM_MEMBERS = 10;
const TEAM_NAME_MIN = 2;
const TEAM_NAME_MAX = 30;

// Create a new team
router.post("/", userMiddleware, async (req: any, res) => {
  try {
    const { name } = req.body;
    const userId = req.userId;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ ok: false, message: "Team name is required" });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < TEAM_NAME_MIN || trimmedName.length > TEAM_NAME_MAX) {
      return res.status(400).json({
        ok: false,
        message: `Team name must be between ${TEAM_NAME_MIN} and ${TEAM_NAME_MAX} characters`,
      });
    }

    const inviteCode = await generateUniqueInviteCode();

    const team = await client.team.create({
      data: {
        name: trimmedName,
        inviteCode,
        ownerId: userId,
        members: {
          create: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                avatarColor: true,
              },
            },
          },
        },
      },
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
      where: { inviteCode: inviteCode.toUpperCase() },
      include: {
        _count: { select: { members: true } },
      },
    });

    if (!team) {
      return res.status(404).json({ ok: false, message: "Team not found" });
    }

    // Check member limit
    if (team._count.members >= MAX_TEAM_MEMBERS) {
      return res.status(400).json({
        ok: false,
        message: `Team is full (max ${MAX_TEAM_MEMBERS} members)`,
      });
    }

    // Check if already a member
    const existing = await client.teamMembership.findUnique({
      where: { teamId_userId: { teamId: team.id, userId } },
    });

    if (existing) {
      return res.status(400).json({ ok: false, message: "Already a member of this team" });
    }

    const membership = await client.teamMembership.create({
      data: { teamId: team.id, userId },
      include: { team: true },
    });

    res.json({ ok: true, data: membership });
  } catch (error) {
    console.error("Join team error:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// Leave a team
router.post("/:teamId/leave", userMiddleware, async (req: any, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.userId;

    const team = await client.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return res.status(404).json({ ok: false, message: "Team not found" });
    }

    if (team.ownerId === userId) {
      return res.status(400).json({
        ok: false,
        message: "Owner cannot leave the team. Transfer ownership or delete the team instead.",
      });
    }

    const membership = await client.teamMembership.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });

    if (!membership) {
      return res.status(400).json({ ok: false, message: "You are not a member of this team" });
    }

    await client.teamMembership.delete({
      where: { teamId_userId: { teamId, userId } },
    });

    res.json({ ok: true, message: "Left team successfully" });
  } catch (error) {
    console.error("Leave team error:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// Remove a member (owner only)
router.delete("/:teamId/members/:memberId", userMiddleware, async (req: any, res) => {
  try {
    const { teamId, memberId } = req.params;
    const userId = req.userId;

    const team = await client.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return res.status(404).json({ ok: false, message: "Team not found" });
    }

    if (team.ownerId !== userId) {
      return res.status(403).json({ ok: false, message: "Only the team owner can remove members" });
    }

    if (memberId === userId) {
      return res.status(400).json({ ok: false, message: "Owner cannot remove themselves" });
    }

    const membership = await client.teamMembership.findUnique({
      where: { teamId_userId: { teamId, userId: memberId } },
    });

    if (!membership) {
      return res.status(404).json({ ok: false, message: "Member not found in this team" });
    }

    await client.teamMembership.delete({
      where: { teamId_userId: { teamId, userId: memberId } },
    });

    res.json({ ok: true, message: "Member removed successfully" });
  } catch (error) {
    console.error("Remove member error:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// Delete a team (owner only)
router.delete("/:teamId", userMiddleware, async (req: any, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.userId;

    const team = await client.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return res.status(404).json({ ok: false, message: "Team not found" });
    }

    if (team.ownerId !== userId) {
      return res.status(403).json({ ok: false, message: "Only the team owner can delete the team" });
    }

    // Memberships cascade-delete via schema
    await client.team.delete({ where: { id: teamId } });

    res.json({ ok: true, message: "Team deleted successfully" });
  } catch (error) {
    console.error("Delete team error:", error);
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
          some: { userId },
        },
      },
      include: {
        owner: {
          select: { id: true, displayName: true, email: true, avatarColor: true },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
                avatarColor: true,
              },
            },
          },
          take: 5, // Only first 5 members for card preview
        },
        _count: {
          select: { members: true },
        },
      },
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
    const userId = req.userId;

    const team = await client.team.findUnique({
      where: { id: teamId },
      include: {
        owner: {
          select: { id: true, displayName: true, email: true, avatarColor: true },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                avatarColor: true,
                rating: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    if (!team) {
      return res.status(404).json({ ok: false, message: "Team not found" });
    }

    // Check if the requesting user is a member
    const isMember = team.members.some((m) => m.userId === userId);

    res.json({ ok: true, data: { ...team, isMember } });
  } catch (error) {
    console.error("Get team detail error:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

export default router;
