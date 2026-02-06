"use client";

import type React from "react";
import { useState } from "react";
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
  LogIn
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
    <main className="min-h-screen w-full bg-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-emerald-500/5 blur-[120px] rounded-full -z-10" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10 space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
            <ShieldCheck className="w-9 h-9 text-emerald-500" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white">100xARENA</h1>
          <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest">
            Authentication Required
          </p>
        </div>

        <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl text-white">System Login</CardTitle>
            <CardDescription className="text-zinc-500">
              Select your clearance level and enter credentials
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSignIn} className="grid gap-6">
              {/* Tactical Role Selector */}
              <div className="grid gap-2">
                <Label className="text-zinc-400 text-xs uppercase tracking-widest">Clearance Level</Label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-black border border-zinc-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setRole("user")}
                    className={`flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-md transition-all ${role === "user"
                        ? "bg-zinc-800 text-emerald-400 shadow-inner"
                        : "text-zinc-500 hover:text-zinc-300"
                      }`}
                  >
                    <UserIcon className="h-4 w-4" />
                    USER
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-md transition-all ${role === "admin"
                        ? "bg-zinc-800 text-rose-400 shadow-inner"
                        : "text-zinc-500 hover:text-zinc-300"
                      }`}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    ADMIN
                  </button>
                </div>
              </div>

              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-zinc-400">Email Address</Label>
                <div className="flex items-center border border-zinc-800 rounded-lg px-3 h-12 bg-black focus-within:border-emerald-500/50 transition-colors">
                  <Mail className="h-4 w-4 text-zinc-600 mr-2" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="operative@arena.com"
                    className="border-0 focus-visible:ring-0 p-0 h-auto bg-transparent text-white placeholder:text-zinc-800"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password */}
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
                className={`w-full h-12 text-base font-bold transition-all shadow-lg ${role === "admin"
                    ? "bg-rose-600 hover:bg-rose-500 shadow-rose-900/20"
                    : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20"
                  }`}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Initialize Session <LogIn className="h-4 w-4" />
                  </span>
                )}
              </Button>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-center font-mono text-rose-400 bg-rose-500/10 py-3 rounded-lg border border-rose-500/20"
                >
                  [SYSTEM_ERROR]: {error}
                </motion.p>
              )}

              <div className="text-center text-sm pt-4 border-t border-zinc-900">
                <span className="text-zinc-500">New recruit? </span>
                <a href="/signup" className="font-bold text-emerald-500 hover:text-emerald-400 transition-colors">
                  Create Identity
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}