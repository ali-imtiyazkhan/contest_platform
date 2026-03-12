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
    ShieldAlert,
    Zap,
    ArrowRight,
    Key,
} from "lucide-react";
import Link from "next/link";

import { BACKEND_URL } from "@/config";
import { useAuth } from "@/context/AuthProvider";

export default function AdminSignUpPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [secretKey, setSecretKey] = useState("");
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

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(
                `${BACKEND_URL}/admin/signup`,
                { email, password, secretKey },
                { withCredentials: true }
            );

            if (response?.data?.success) {
                const { accessToken, user } = response.data;
                localStorage.setItem("accesstoken", accessToken);
                login(user, accessToken);
                router.push("/admin");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Registration Failed: Check your credentials and secret key");
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
                    background: `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,94,26,0.12), transparent 50%)`,
                }}
            />

            <div className="w-full max-w-lg mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="text-center mb-8">
                        <Link href="/">
                            <h1
                                className="text-cream font-extrabold tracking-[3px] leading-none text-4xl inline-block"
                                style={{ fontFamily: "'Bebas Neue', cursive" }}
                            >
                                Arena<span className="text-acid">X</span> <span className="text-orange">ADMIN</span>
                            </h1>
                        </Link>
                    </div>

                    <div className="bg-[#111113]/80 backdrop-blur-xl border border-white/8 rounded-2xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
                        <div className="mb-8 text-center">
                            <div className="w-16 h-16 bg-orange/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange/30 shadow-[0_0_20px_rgba(255,94,26,0.15)]">
                                <ShieldAlert className="h-8 w-8 text-orange" />
                            </div>
                            <h2
                                className="text-cream font-extrabold text-3xl leading-tight mb-2"
                                style={{ fontFamily: "'Bebas Neue', cursive" }}
                            >
                                Elevated Clearance
                            </h2>
                            <p className="text-muted text-sm px-8">
                                Register as a platform administrator. Requires a valid system security key.
                            </p>
                        </div>

                        <form onSubmit={handleSignUp} className="space-y-6">
                            {/* Email */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="block font-mono text-[0.7rem] text-muted tracking-[2px] uppercase">
                                    Administrative Email
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted group-focus-within:text-orange transition-colors" />
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="admin@arena.com"
                                        className="w-full bg-black/40 border border-white/8 rounded-lg pl-11 pr-4 py-3.5 text-cream text-sm outline-none focus:border-orange/50 focus:bg-black/60 transition-all placeholder:text-muted/40"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label htmlFor="password" className="block font-mono text-[0.7rem] text-muted tracking-[2px] uppercase">
                                    Access Credential
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted group-focus-within:text-orange transition-colors" />
                                    <input
                                        id="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-black/40 border border-white/8 rounded-lg pl-11 pr-4 py-3.5 text-cream text-sm outline-none focus:border-orange/50 focus:bg-black/60 transition-all placeholder:text-muted/40"
                                    />
                                </div>
                            </div>

                            {/* Secret Key */}
                            <div className="space-y-2">
                                <label htmlFor="secretKey" className="block font-mono text-[0.7rem] text-muted tracking-[2px] uppercase">
                                    System Security Key
                                </label>
                                <div className="relative group">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted group-focus-within:text-orange transition-colors" />
                                    <input
                                        id="secretKey"
                                        type="password"
                                        required
                                        value={secretKey}
                                        onChange={(e) => setSecretKey(e.target.value)}
                                        placeholder="Master Secret"
                                        className="w-full bg-black/40 border border-white/8 rounded-lg pl-11 pr-4 py-3.5 text-cream text-sm outline-none focus:border-orange/50 focus:bg-black/60 transition-all placeholder:text-muted/40"
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
                                    <span className="font-bold">[REJECTED]:</span> {error}
                                </motion.div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-lg bg-orange text-black font-extrabold text-sm tracking-[2px] uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-orange/20 hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Verifying Clearance...
                                    </>
                                ) : (
                                    <>
                                        Authorize Administrator
                                        <ShieldCheck className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </form>
                        
                        <div className="mt-8 text-center">
                            <p className="text-muted text-xs">
                                Already have clearance?{" "}
                                <Link href="/adminLogin" className="text-orange hover:underline font-bold">
                                    Sign In here
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
