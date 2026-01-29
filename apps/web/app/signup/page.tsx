"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

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
  const [role, setRole] = useState("user");
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
      const response = await axios.post(
        `${BACKEND_URL}/api/v1/user/signup`,
        { email, password },
        { withCredentials: true },
      );

      if (response?.data) {
        setStep("otp");
      }
    } catch (err: any) {
      console.error("Failed to request OTP:", err);
      setError(err.response?.data?.message || "Failed to send OTP");
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
        { withCredentials: true },
      );

      if (response.status === 201 || response.status === 200) {
        const { accessToken, user } = response.data;
        login(user, accessToken);
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Failed to verify OTP:", err);
      setError(err.response?.data?.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full min-h-[calc(100vh-4rem)] flex justify-center pt-24 px-4">
      <div className="w-full max-w-md grid gap-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-pretty text-2xl font-semibold">
            Welcome to 100xContest
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign up with your email to join live developer challenges.
          </p>
        </div>

        {/* Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {step === "email" ? "Sign up" : "Enter OTP"}
            </CardTitle>
            <CardDescription>
              {step === "email"
                ? "We will generate a one-time passcode"
                : "Enter the 6-digit code sent to your email."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === "email" ? (
              <form onSubmit={requestOtp} className="grid gap-4">
                {/* Email */}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Password */}
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {/* Role */}
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-2 text-sm"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="user">User</option>
                  </select>
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? "Sending..." : "Send code"}
                </Button>

                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  Tip: use your personal email.
                </p>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">
                    Already have an account?{" "}
                  </span>
                  <a href="/signin" className="text-primary hover:underline">
                    Sign in here
                  </a>
                </div>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="code">6-digit code</Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? "Verifying..." : "Verify"}
                </Button>

                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
