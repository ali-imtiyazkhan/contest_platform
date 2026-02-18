"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Loader2,
  Mail,
  Lock,
  ShieldCheck,
  User as UserIcon,
  ShieldAlert,
  Zap,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

import { BACKEND_URL } from "@/config";
import { useAuth } from "@/context/AuthProvider";

export default function SignInPage() {
  const [role, setRole] = useState<"user" | "admin">("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint =
        role === "user"
          ? `${BACKEND_URL}/api/v1/user/signin`
          : `${BACKEND_URL}/api/v1/admin/signin`;

      const response = await axios.post(
        endpoint,
        { email, password },
        { withCredentials: true }
      );

      if (response?.data) {
        const { accessToken, user } = response.data;
        localStorage.setItem("accesstoken", accessToken);
        login(user, accessToken);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Access Denied: Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center px-4 relative overflow-hidden"
      style={{ fontFamily: "'Syne', sans-serif" }}
    >
      {/* Animated gradient cursor follower */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(200,241,53,0.12), transparent 50%)`,
        }}
      />

      {/* Diagonal accent line */}
      <div className="absolute top-0 right-0 w-150 h-150 bg-linear-to-br from-acid/5 to-transparent rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-125 h-125 bg-linear-to-tr from-orange/5 to-transparent rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left side — Branding */}
        <div className="hidden lg:block space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link href="/" className="inline-block group">
              <h1
                className="text-cream font-extrabold tracking-[3px] leading-none text-6xl mb-3 group-hover:text-acid transition-colors duration-300"
                style={{ fontFamily: "'Bebas Neue', cursive" }}
              >
                Arena<span className="text-acid">X</span>
              </h1>
            </Link>
            <p className="text-muted text-lg max-w-md leading-relaxed">
              Compete. Dominate. Rise through the ranks in the ultimate contest arena.
            </p>
          </motion.div>

          <motion.div
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {[
              { icon: Zap, text: "AI-judged challenges with instant feedback", color: "text-acid" },
              { icon: ShieldCheck, text: "Secure authentication & role-based access", color: "text-emerald-400" },
              { icon: UserIcon, text: "Live leaderboards & real-time competition", color: "text-orange" },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-4 group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <div className="w-12 h-12 rounded-xl bg-white/3 border border-white/8 flex items-center justify-center group-hover:bg-white/6 group-hover:border-acid/30 transition-all duration-300">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span className="text-cream/80 text-sm group-hover:text-cream transition-colors">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="pt-8 border-t border-white/6 space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p className="font-mono text-[0.7rem] text-muted tracking-[2px] uppercase">Trusted By</p>
            <div className="flex gap-6 items-center">
              {["12K+", "340+", "$150K"].map((stat, i) => (
                <div key={i}>
                  <div
                    className="text-acid font-extrabold text-2xl leading-none"
                    style={{ fontFamily: "'Bebas Neue', cursive" }}
                  >
                    {stat}
                  </div>
                  <div className="font-mono text-[0.65rem] text-muted mt-1">
                    {["Users", "Contests", "Prizes"][i]}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right side — Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md mx-auto lg:mx-0"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/">
              <h1
                className="text-cream font-extrabold tracking-[3px] leading-none text-4xl inline-block"
                style={{ fontFamily: "'Bebas Neue', cursive" }}
              >
                Arena<span className="text-acid">X</span>
              </h1>
            </Link>
          </div>

          <div className="bg-[#111113]/80 backdrop-blur-xl border border-white/8 rounded-2xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
            {/* Header */}
            <div className="mb-8">
              <h2
                className="text-cream font-extrabold text-3xl leading-tight mb-2"
                style={{ fontFamily: "'Bebas Neue', cursive" }}
              >
                System Access
              </h2>
              <p className="text-muted text-sm">
                Don't have an account?{" "}
                <Link href="/signup" className="text-acid hover:underline font-semibold">
                  Create one →
                </Link>
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-6">
              {/* Role selector */}
              <div className="space-y-2">
                <label className="block font-mono text-[0.7rem] text-muted tracking-[2px] uppercase">
                  Clearance Level
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 border border-white/6 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setRole("user")}
                    className={`flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-md transition-all duration-200 ${role === "user"
                        ? "bg-acid/20 text-acid border border-acid/30 shadow-[0_0_20px_rgba(200,241,53,0.15)]"
                        : "text-muted hover:text-cream hover:bg-white/3"
                      }`}
                  >
                    <UserIcon className="h-4 w-4" />
                    USER
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-md transition-all duration-200 ${role === "admin"
                        ? "bg-orange/20 text-orange border border-orange/30 shadow-[0_0_20px_rgba(255,94,26,0.15)]"
                        : "text-muted hover:text-cream hover:bg-white/3"
                      }`}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    ADMIN
                  </button>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block font-mono text-[0.7rem] text-muted tracking-[2px] uppercase">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted group-focus-within:text-acid transition-colors" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operative@arena.com"
                    className="w-full bg-black/40 border border-white/8 rounded-lg pl-11 pr-4 py-3.5 text-cream text-sm outline-none focus:border-acid/50 focus:bg-black/60 transition-all placeholder:text-muted/40"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block font-mono text-[0.7rem] text-muted tracking-[2px] uppercase">
                    Security Key
                  </label>
                  <Link href="/forgot-password" className="text-[0.7rem] text-acid hover:underline font-mono">
                    Forgot?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted group-focus-within:text-acid transition-colors" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/40 border border-white/8 rounded-lg pl-11 pr-4 py-3.5 text-cream text-sm outline-none focus:border-acid/50 focus:bg-black/60 transition-all placeholder:text-muted/40"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm font-mono"
                >
                  <span className="font-bold">[ERROR]:</span> {error}
                </motion.div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-lg font-extrabold text-sm tracking-[2px] uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${role === "admin"
                    ? "bg-orange text-black hover:opacity-90 hover:-translate-y-0.5 shadow-orange/20"
                    : "bg-acid text-black hover:opacity-90 hover:-translate-y-0.5 shadow-acid/20"
                  } disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Initialize Session
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer note */}
          <p className="text-center text-[0.7rem] text-muted/60 mt-6">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-cream hover:text-acid transition-colors">
              Terms
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}