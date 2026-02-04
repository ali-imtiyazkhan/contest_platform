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

export default function SignInPage() {
  const [role, setRole] = useState<"user" | "admin">("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { login } = useAuth();

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
        {
          email,
          password,
        },
        {
          withCredentials: true,
        },
      );

      console.log("response is :", response.data)

      if (response?.data) {

        const { accessToken, user } = response.data;

        localStorage.setItem("accesstoken", response?.data.accessToken)

        login(user, accessToken);
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Failed to sign in:", err);
      setError(err.response?.data?.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-linear-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-6 space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">100xContest</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back. Sign in to continue your challenges.
          </p>
        </div>

        <Card className="border border-slate-200 shadow-2xl bg-white">
          <CardHeader>
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>
              Choose your role and enter your credentials
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSignIn} className="grid gap-5">
              {/* Role */}
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  className="h-11 rounded-md border px-3 bg-background text-sm"
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as "user" | "admin")
                  }
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-11"
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
                  placeholder="••••••••"
                  className="h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold cursor-pointer"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              {error && (
                <p className="text-sm text-center text-destructive">
                  {error}
                </p>
              )}

              <div className="text-center text-sm mt-2">
                <span className="text-muted-foreground">
                  Don’t have an account?{" "}
                </span>
                <a href="/signup" className="font-semibold text-primary hover:underline">
                  Sign up
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );


}
