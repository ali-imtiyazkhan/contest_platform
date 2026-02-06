"use client";

import React, { useState } from "react";
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
  Terminal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BACKEND_URL } from "@/config";
import { useAuth } from "@/context/AuthProvider";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"email" | "otp">("email");

  const router = useRouter();
  const { login } = useAuth();

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

  return (
    <main className="min-h-screen w-full bg-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-emerald-500/5 blur-[120px] rounded-full -z-10" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10 space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
            <ShieldCheck className="w-9 h-9 text-emerald-500" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white">
            JOIN THE ARENA
          </h1>
          <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest">
            Identity Verification Required
          </p>
        </div>

        <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-500" />
              {step === "email" ? "Initialize Account" : "Verify Protocol"}
            </CardTitle>
            <CardDescription className="text-zinc-500">
              {step === "email"
                ? "Provide your credentials to establish a session"
                : `Enter the 6-digit code sent to ${email}`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {step === "email" ? (
                <motion.form
                  key="email-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={requestOtp}
                  className="grid gap-5"
                >
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-zinc-400">Email Address</Label>
                    <div className="flex items-center border border-zinc-800 rounded-lg px-3 h-12 bg-black focus-within:border-emerald-500/50 transition-colors">
                      <Mail className="h-4 w-4 text-zinc-600 mr-2" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="hacker@arena.com"
                        className="border-0 focus-visible:ring-0 p-0 h-auto bg-transparent text-white placeholder:text-zinc-800"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="password text-zinc-400">Security Key</Label>
                    <div className="flex items-center border border-zinc-800 rounded-lg px-3 h-12 bg-black focus-within:border-emerald-500/50 transition-colors">
                      <Lock className="h-4 w-4 text-zinc-600 mr-2" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="border-0 focus-visible:ring-0 p-0 h-auto bg-transparent text-white placeholder:text-zinc-800"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-500 text-white mt-2 transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Request Access Code
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="otp-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={verifyOtp}
                  className="grid gap-6"
                >
                  <div className="grid gap-2 text-center">
                    <Label htmlFor="code" className="sr-only">OTP Code</Label>
                    <Input
                      id="code"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      className="text-center text-3xl tracking-[0.5em] h-16 font-mono bg-black border-zinc-800 text-emerald-500 focus-visible:ring-emerald-500/30"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]"
                    disabled={loading || code.length !== 6}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Establish Session"
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="flex items-center justify-center text-xs font-mono text-zinc-500 hover:text-emerald-500 transition-colors uppercase tracking-widest"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Re-enter Identity
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {error && (
              <motion.p
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 text-xs text-center font-mono text-rose-400 bg-rose-500/10 py-3 rounded-lg border border-rose-500/20"
              >
                [ERROR]: {error}
              </motion.p>
            )}

            <div className="mt-8 pt-6 border-t border-zinc-900 text-center text-sm">
              <span className="text-zinc-500">Known operative? </span>
              <a href="/signin" className="font-bold text-emerald-500 hover:text-emerald-400 transition-colors">
                Sign In
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}