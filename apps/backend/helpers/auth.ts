import jwt from "jsonwebtoken";
import axios from "axios";
import crypto from "crypto";
import { client } from "db/client";

const generateOtp = () => {
  return crypto.randomInt(100000, 999999);
};


// send otp to the user
const sendOtp = async (email: string, otp: string) => {
  console.log(`[AUTH] Attempting to send OTP to ${email} via Resend API`);
  
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";

  if (!resendKey) {
    console.error("[AUTH] RESEND_API_KEY environment variable is missing!");
    throw new Error("Email service API key is not configured.");
  }

  const htmlContent = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #333; font-weight: 500;">Hi there,</h2>
      <p style="font-size: 15px; color: #444;">
        Please use the code below to confirm your email address and continue on <strong>100xContest</strong>.
        This code will expire in <strong>5 minutes</strong>. If you don't think you should be receiving this email, you can safely ignore it.
      </p>

      <div style="text-align: center; margin: 40px 0;">
        <span style="font-size: 42px; font-weight: bold; color: #000;">${otp}</span>
      </div>

      <hr style="border: none; border-top: 1px solid #ccc;" />

      <p style="font-size: 12px; color: #999; margin-top: 20px;">
        You received this email because you requested a confirmation code from <strong>100xContest</strong>.
      </p>
    </div>
  `;

  try {
    const response = await axios.post(
      "https://api.resend.com/emails",
      {
        from: fromEmail,
        to: email,
        subject: "Email verification code - 100xContest",
        html: htmlContent,
      },
      {
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    console.log(`[AUTH] OTP sent successfully via Resend to ${email}. ID: ${response.data.id}`);
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error(`[AUTH] Failed to send email via Resend to ${email}:`, errorMsg);
    throw new Error(`Email delivery failed: ${errorMsg}`);
  }
};

// resend otp
const resendOtp = async (email: string) => {
  const otp = generateOtp().toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await client.otpVerification.upsert({
    where: { email },
    update: { otp, expiresAt, attempts: 0 },
    create: { email, otp, expiresAt },
  });

  await sendOtp(email, otp);
};


// Generate AccessToken
const generateAccessToken = (user: any) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    secret,
    {
      expiresIn: "2h",
    },
  );
};

// Generate Refresh Token
const generateRefreshToken = (user: any) => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!refreshSecret) {
    throw new Error(
      "JWT_REFRESH_SECRET is not defined in environment variables",
    );
  }
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    refreshSecret,
    {
      expiresIn: "30d",
    },
  );
};


// Refresh Access Token
const refreshAccessToken = (refreshToken: string) => {
  const decoded = jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET as string,
  ) as {
    userId: string;
    email: string;
    role: string;
  };

  return generateAccessToken({
    id: decoded.userId,
    email: decoded.email,
    role: decoded.role,
  });
};

// Export All the feature 
export {
  generateOtp,
  generateAccessToken,
  generateRefreshToken,
  sendOtp,
  refreshAccessToken,
  resendOtp
};
