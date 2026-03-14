import { Router } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { client } from "db/client";
import { generateAccessToken, generateRefreshToken } from "../helpers/auth";

const router = Router();

// Passport configuration
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            callbackURL: `${process.env.BACKEND_URL}/api/v1/auth/google/callback`,
        },
        async (_accessToken: string, _refreshToken: string, profile: any, done: (err: any, user?: any) => void) => {
            try {
                const email = profile.emails?.[0].value;
                if (!email) return done(new Error("No email found from Google profile"));

                const user = await client.user.upsert({
                    where: { email },
                    update: {
                        provider: "google",
                        providerId: profile.id,
                        avatarUrl: profile.photos?.[0].value,
                    },
                    create: {
                        email,
                        displayName: profile.displayName,
                        provider: "google",
                        providerId: profile.id,
                        avatarUrl: profile.photos?.[0].value,
                    },
                });

                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }
    )
);

passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID || "",
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
            callbackURL: `${process.env.BACKEND_URL}/api/v1/auth/github/callback`,
        },
        async (_accessToken: string, _refreshToken: string, profile: any, done: (err: any, user?: any) => void) => {
            try {
                const email = profile.emails?.[0].value;
                if (!email) return done(new Error("No email found from GitHub profile"));

                const user = await client.user.upsert({
                    where: { email },
                    update: {
                        provider: "github",
                        providerId: profile.id,
                        avatarUrl: profile.photos?.[0].value,
                    },
                    create: {
                        email,
                        displayName: profile.displayName || profile.username,
                        provider: "github",
                        providerId: profile.id,
                        avatarUrl: profile.photos?.[0].value,
                    },
                });

                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }
    )
);

// Auth Routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/login", session: false }),
    (req: any, res) => {
        const user = req.user;
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${accessToken}`);
    }
);

router.get("/github", passport.authenticate("github", { scope: ["user:email"], session: false }));

router.get(
    "/github/callback",
    passport.authenticate("github", { failureRedirect: "/login", session: false }),
    (req: any, res) => {
        const user = req.user;
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${accessToken}`);
    }
);

export default router;
