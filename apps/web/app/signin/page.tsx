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
    <main className="w-full min-h-[calc(100vh-4rem)] flex justify-center pt-24">
      <div className="w-full max-w-md px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold">
            Welcome to 100xContest
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in with your email to join live developer challenges.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sign In</CardTitle>
            <CardDescription>
              Choose your role and enter your credentials to sign in.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSignIn} className="grid gap-4">
              {/* Role */}
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-2 text-sm"
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

              <Button type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Tip: use your personal email.
              </p>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  Don't have an account?{" "}
                </span>
                <a href="/signup" className="text-primary hover:underline">
                  Sign up here
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );

}
