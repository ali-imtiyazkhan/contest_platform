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
        err.response?.data?.message || "Something went wrong. Please try again."
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
      setError(err.response?.data?.message || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-linear-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">100xContest</h1>
          <p className="text-muted-foreground text-sm">
            Join the elite circle of developers
          </p>
        </div>

        <Card className="border border-slate-200 shadow-2xl bg-white">
          <CardHeader>
            <CardTitle className="text-2xl">
              {step === "email" ? "Create an account" : "Check your inbox"}
            </CardTitle>
            <CardDescription>
              {step === "email"
                ? "Enter your details to get started"
                : `We sent a verification code to ${email}`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {step === "email" ? (
                <motion.form
                  key="email-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={requestOtp}
                  className="grid gap-5"
                >
                  {/* Email */}
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email address</Label>
                    <div className="flex items-center border rounded-md px-3 h-11 bg-background">
                      <Mail className="h-4 w-4 text-muted-foreground mr-2" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        className="border-0 focus-visible:ring-0 p-0 h-auto"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="flex items-center border rounded-md px-3 h-11 bg-background">
                      <Lock className="h-4 w-4 text-muted-foreground mr-2" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="border-0 focus-visible:ring-0 p-0 h-auto"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold mt-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {loading ? "Sending code..." : "Continue"}
                    {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="otp-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={verifyOtp}
                  className="grid gap-5"
                >
                  <div className="grid gap-2 text-center">
                    <Label htmlFor="code" className="sr-only">
                      OTP Code
                    </Label>
                    <Input
                      id="code"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      className="text-center text-2xl tracking-[0.5em] h-14 font-mono"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold"
                    disabled={loading || code.length !== 6}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Verify & Complete"
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to email
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-sm text-center text-destructive bg-destructive/10 py-2 rounded-md"
              >
                {error}
              </motion.p>
            )}

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                Already have an account?{" "}
              </span>
              <a href="/signin" className="font-semibold text-primary hover:underline">
                Sign in
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
