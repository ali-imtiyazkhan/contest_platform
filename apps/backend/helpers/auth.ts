import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { client } from "db/client";

const generateOtp = () => {
  return crypto.randomInt(100000, 999999);
};


// send otp to the user
const sendOtp = async (email: string, otp: string) => {
  console.log(`[AUTH] Attempting to send OTP to ${email}`);
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("[AUTH] EMAIL_USER or EMAIL_PASS environment variables are missing!");
    throw new Error("Email service is not configured on the server.");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Adding timeouts to prevent hanging
    connectionTimeout: 10000, 
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  const mailOptions = {
    from: `"100xContest" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Email verification code",
    html: `
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
        `,
  };

  try {
    await Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Email sending timed out after 10 seconds")), 10000))
    ]);
    console.log(`[AUTH] OTP sent successfully to ${email}`);
  } catch (error) {
    console.error(`[AUTH] Failed to send email to ${email}:`, error);
    throw error; // Re-throw to be caught by the route handler
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
