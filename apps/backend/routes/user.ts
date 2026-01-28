import { client } from "db/client";

import { Router } from "express";
import {
  generateAccessToken,
  generateOtp,
  generateRefreshToken,
  refreshAccessToken,
  sendOtp,
  // resendOtp,
} from "../helpers/auth";
import { hash, compare } from "../helpers/bcrypt";
import { error } from "console";

const router = Router();

router.post("/signup", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required!" });
    }

    const exists = await client.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    const Password = await hash(password);

    if (exists) {
      return res.status(409).json({ message: "User already exists!" });
    }

    const otp = generateOtp().toString();

    await sendOtp(email, otp);

    res.status(200).json({
      message: "OTP sent successfully",
      email,
      otp,
      Password,
      role,
      nextStep: "/verify-otp",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required!" });
    }

    const user = await client.user.findFirst({
      where: { email: email.toLowerCase(), role: "User" },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.password) {
      throw new Error("user password is missing");
    }

    const isValidPassword = await compare(password, user.password);
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

export default router;
