import { Router } from "express";
import { client } from "db/client";
import { generateAccessToken, generateRefreshToken } from "../helpers/auth";
import { compare, hash } from "../helpers/bcrypt";
import { processContestRating } from "../src/services/ratingService";

const router = Router();

router.post("/signup", async (req, res) => {
  try {
    const { email, password, secretKey } = req.body;

    if (!email || !password || !secretKey) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and security key are required",
      });
    }

    // Verify secret key to prevent unauthorized admin signup
    if (secretKey !== process.env.ADMIN_SIGNUP_SECRET) {
      return res.status(403).json({
        success: false,
        message: "Invalid security key for admin registration",
      });
    }

    const normalizedEmail = email.toLowerCase();
    const existingAdmin = await client.user.findFirst({
      where: { email: normalizedEmail },
    });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "Account already exists",
      });
    }

    const hashedPassword = await hash(password);
    const admin = await client.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        role: "Admin",
      },
    });

    const accessToken = generateAccessToken(admin);
    const refreshToken = generateRefreshToken(admin);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      accessToken,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin signup error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
    });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    console.log(`[ADMIN-SIGNIN] Attempt for email: ${email.toLowerCase()}`);
    const admin = await client.user.findFirst({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!admin) {
      console.log(`[ADMIN-SIGNIN] User ${email} NOT found in DB`);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    console.log(`[ADMIN-SIGNIN] User found: ${admin.email}, Role in DB: ${admin.role}`);

    if (admin.role !== "Admin") {
      console.log(`[ADMIN-SIGNIN] Role mismatch: User is ${admin.role}, but trying to login via Admin route`);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials (Role mismatch)",
      });
    }

    if (!admin.password) {
      throw new Error("Admin password is missing");
    }

    const isValidPassword = await compare(password, admin.password);
    console.log(`[ADMIN-SIGNIN] Password comparison result: ${isValidPassword}`);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const accessToken = generateAccessToken(admin);
    const refreshToken = generateRefreshToken(admin);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin signin error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.post("/admin/contest/:contestId/process-rating", async (req, res) => {
  try {
    await processContestRating(req.params.contestId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
});

export default router;
