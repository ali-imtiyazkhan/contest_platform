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
        async (accessToken: string, _refreshToken: string, profile: any, done: (err: any, user?: any) => void) => {
            try {
                console.log("GitHub Profile received for ID:", profile.id);
                
                let email = profile.emails?.[0]?.value;
                
                if (!email && accessToken) {
                    console.log("Email not found in profile, attempting to fetch from GitHub API...");
                    try {
                        const response = await fetch('https://api.github.com/user/emails', {
                            headers: {
                                'Authorization': `token ${accessToken}`,
                                'User-Agent': '100xContest-Backend'
                            }
                        });
                        const emails: any = await response.json();
                        if (Array.isArray(emails)) {
                            const primaryEmail = emails.find(e => e.primary && e.verified) || emails.find(e => e.primary) || emails[0];
                            if (primaryEmail) email = primaryEmail.email;
                        }
                    } catch (fetchError) {
                        console.error("Error fetching emails from GitHub:", fetchError);
                    }
                }

                if (!email) {
                    console.error("Authentication failed: No email found for GitHub user", profile.id);
                    return done(new Error("No email found from GitHub profile. Please ensure you have a verified email on GitHub."));
                }

                console.log("Upserting GitHub user with email:", email);
                const user = await client.user.upsert({
                    where: { email },
                    update: {
                        provider: "github",
                        providerId: profile.id,
                        avatarUrl: profile.photos?.[0]?.value,
                    },
                    create: {
                        email,
                        displayName: profile.displayName || profile.username,
                        provider: "github",
                        providerId: profile.id,
                        avatarUrl: profile.photos?.[0]?.value,
                    },
                });

                return done(null, user);
            } catch (error) {
                console.error("GitHub Strategy Error:", error);
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
