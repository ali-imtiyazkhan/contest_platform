import { Router } from "express";
import { client } from "db/client";
import { generateAccessToken, generateRefreshToken } from "../helpers/auth";
// import { compare } from "../helpers/bcrypt";

const router = Router();

/**
 * ADMIN SIGNIN
 * Note: Admin signup is not allowed. Seed admin manually.
 */
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const admin = await client.user.findFirst({
      where: {
        email: email.toLowerCase(),
        role: "Admin",
      },
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // const isValidPassword = await compare(password, admin.password);

    // if (!isValidPassword) {
    //   return res.status(401).json({
    //     success: false,
    //     message: "Invalid credentials",
    //   });
    // }

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

export default router;
