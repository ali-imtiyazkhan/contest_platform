import { client } from "db/client";

import { Router } from "express";
import { userMiddleware } from "../middleware/user";
import {
  generateAccessToken,
  generateRefreshToken,
  refreshAccessToken,
} from "../helpers/auth";
import { compare } from "../helpers/bcrypt";

const router = Router();

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required!" });
    }

    console.log(`[SIGNIN] Attempt for email: ${email.toLowerCase()}`);
    const user = await client.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      console.log(`[SIGNIN] User ${email} NOT found in DB`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log(`[SIGNIN] User found: ${user.email}, Role in DB: ${user.role}`);

    if (user.role !== "User") {
      console.log(`[SIGNIN] Role mismatch: User is ${user.role}, but trying to login via User route`);
      return res.status(401).json({ message: "Invalid credentials (Role mismatch)" });
    }

    if (!user.password) {
      throw new Error("user password is missing");
    }

    const isValidPassword = await compare(password, user.password);
    console.log(`[SIGNIN] Password comparison result: ${isValidPassword}`);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,

      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/signout", async (_req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  res.status(200).json({ message: "Logged out successfully" });
});

router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  try {
    const newAccessToken = refreshAccessToken(refreshToken);
    res.status(200).json({ accessToken: newAccessToken });
  } catch {
    return res.status(403).json({ message: "Invalid refresh token" });
  }
});

// Get own profile with stats
router.get("/profile", userMiddleware, async (req: any, res) => {
  try {
    const userId = req.userId;

    const user = await client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        country: true,
        avatarColor: true,
        rating: true,
        contestParticipants: {
          select: { id: true },
        },
        contestSubmissions: {
          select: { points: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    // Global rank = users with higher rating + 1
    const higherRatedCount = await client.user.count({
      where: { rating: { gt: user.rating }, role: "User" },
    });

    const totalPoints = user.contestSubmissions.reduce(
      (sum: number, s: { points: number }) => sum + (s.points || 0),
      0
    );

    res.json({
      ok: true,
      data: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        country: user.country,
        avatarColor: user.avatarColor,
        rating: user.rating,
        contestsPlayed: user.contestParticipants.length,
        totalPoints,
        rank: higherRatedCount + 1,
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// Update own profile
router.put("/profile", userMiddleware, async (req: any, res) => {
  try {
    const userId = req.userId;
    const { displayName, country, avatarColor } = req.body;

    const updated = await client.user.update({
      where: { id: userId },
      data: {
        ...(displayName !== undefined ? { displayName } : {}),
        ...(country !== undefined ? { country } : {}),
        ...(avatarColor !== undefined ? { avatarColor } : {}),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        country: true,
        avatarColor: true,
        rating: true,
      },
    });

    res.json({ ok: true, data: updated });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// Search users
router.get("/search", userMiddleware, async (req: any, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== "string") {
      return res.status(400).json({ ok: false, message: "Search query required" });
    }

    const users = await client.user.findMany({
      where: {
        OR: [
          { displayName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } }
        ],
        NOT: { id: req.userId }
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        avatarColor: true,
        rating: true
      },
      take: 10
    });

    res.json({ ok: true, data: users });
  } catch (error) {
    console.error("User search error:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

export default router;
