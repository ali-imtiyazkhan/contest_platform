"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Mail,
  Lock,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Terminal,
} from "lucide-react";
import Link from "next/link";

import { BACKEND_URL } from "@/config";
import { useAuth } from "@/context/AuthProvider";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [passwordStrength, setPasswordStrength] = useState(0);

  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  useEffect(() => {
    const pw = password;
    let strength = 0;
    if (pw.length > 6) strength++;
    if (pw.length > 10) strength++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) strength++;
    if (/\d/.test(pw)) strength++;
    if (/[^A-Za-z0-9]/.test(pw)) strength++;
    setPasswordStrength(strength);
  }, [password]);

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await axios.post(
        `${BACKEND_URL}/api/v1/user/signup`,
        { email, password },
        { withCredentials: true }
      );
      setStep("otp");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Authentication system error. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/v1/user/verify-otp`,
        { email, password, otp: code },
        { withCredentials: true }
      );

      if (response.status === 201 || response.status === 200) {
        const { accessToken, user } = response.data;
        login(user, accessToken);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired protocol code.");
    } finally {
      setLoading(false);
    }
  };

  const strengthColors = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#c8f135"];
  const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Excellent"];

  return (
    <main
      className="min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center px-4 relative overflow-hidden"
      style={{ fontFamily: "'Syne', sans-serif" }}
    >
      {/* Animated gradient */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(200,241,53,0.12), transparent 50%)`,
        }}
      />

      {/* Background blurs */}
      <div className="absolute top-0 left-0 w-125 h-125 bg-linear-to-br from-acid/5 to-transparent rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-150 h-150 bg-linear-to-tl from-orange/5 to-transparent rounded-full blur-[100px] translate-y-1/2 translate-x-1/2" />

      {/* Noise */}
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
              Join thousands of competitors. Prove your skills. Win real prizes.
            </p>
          </motion.div>

          <motion.div
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {[
              { icon: Terminal, text: "Code, write, and solve challenges in real-time", color: "text-acid" },
              { icon: Zap, text: "AI-powered instant scoring & detailed feedback", color: "text-emerald-400" },
              { icon: ShieldCheck, text: "Secure OTP verification protects your account", color: "text-orange" },
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
            className="pt-8 space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-acid shrink-0" />
              <span className="text-muted text-sm">Free to join • No credit card required</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-acid shrink-0" />
              <span className="text-muted text-sm">Compete in 340+ live contests</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-acid shrink-0" />
              <span className="text-muted text-sm">Win cash prizes & build your reputation</span>
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
                {step === "email" ? "Create Account" : "Verify Identity"}
              </h2>
              <p className="text-muted text-sm">
                {step === "email" ? (
                  <>
                    Already registered?{" "}
                    <Link href="/signin" className="text-acid hover:underline font-semibold">
                      Sign in →
                    </Link>
                  </>
                ) : (
                  <>Code sent to {email}</>
                )}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {step === "email" ? (
                <motion.form
                  key="email-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={requestOtp}
                  className="space-y-6"
                >
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
                        placeholder="hacker@arena.com"
                        className="w-full bg-black/40 border border-white/8 rounded-lg pl-11 pr-4 py-3.5 text-cream text-sm outline-none focus:border-acid/50 focus:bg-black/60 transition-all placeholder:text-muted/40"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="block font-mono text-[0.7rem] text-muted tracking-[2px] uppercase">
                      Security Key
                    </label>
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
                    {/* Strength meter */}
                    {password && (
                      <div className="space-y-1.5">
                        <div className="flex gap-1">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-1 flex-1 rounded-full bg-white/8 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: passwordStrength > i ? "100%" : "0%",
                                  background: strengthColors[Math.min(passwordStrength - 1, 4)] || "#ef4444",
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <p
                          className="text-[0.7rem] font-mono font-bold"
                          style={{ color: strengthColors[Math.min(passwordStrength - 1, 4)] || "#ef4444" }}
                        >
                          {strengthLabels[Math.min(passwordStrength - 1, 4)] || "Too short"}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-acid text-black py-4 rounded-lg font-extrabold text-sm tracking-[2px] uppercase hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 transition-all duration-200 shadow-lg shadow-acid/20 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending Code...
                      </>
                    ) : (
                      <>
                        Request Access Code
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="otp-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={verifyOtp}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <label htmlFor="code" className="block font-mono text-[0.7rem] text-muted tracking-[2px] uppercase text-center">
                      6-Digit Verification Code
                    </label>
                    <input
                      id="code"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      required
                      autoFocus
                      className="w-full text-center text-3xl tracking-[0.5em] h-20 font-mono bg-black/40 border-2 border-white/8 rounded-lg text-acid focus:border-acid/50 outline-none transition-all placeholder:text-muted/20"
                    />
                    <p className="text-center text-[0.7rem] text-muted">
                      Didn't receive?{" "}
                      <button
                        type="button"
                        onClick={() => setStep("email")}
                        className="text-acid hover:underline font-semibold"
                      >
                        Resend code
                      </button>
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="w-full bg-acid text-black py-4 rounded-lg font-extrabold text-sm tracking-[2px] uppercase hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 transition-all duration-200 shadow-lg shadow-acid/20 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify & Create Account
                        <CheckCircle2 className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="flex items-center justify-center text-sm text-muted hover:text-cream transition-colors mx-auto gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Change email
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm font-mono"
              >
                <span className="font-bold">[ERROR]:</span> {error}
              </motion.div>
            )}
          </div>

          <p className="text-center text-[0.7rem] text-muted/60 mt-6">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="text-cream hover:text-acid transition-colors">
              Terms
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}