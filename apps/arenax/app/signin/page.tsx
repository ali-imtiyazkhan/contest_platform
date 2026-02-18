"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        email: "",
        password: "",
        remember: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener("mousemove", handleMove);
        return () => window.removeEventListener("mousemove", handleMove);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/user/signin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                }),
            });

            const data = await res.json();
            
            console.log("user data is : ", data);
            if (!res.ok) {
                throw new Error(data.message || "Login failed");
            }

            if (data.accessToken) {
                if (form.remember) {
                    localStorage.setItem("token", data.accessToken);
                } else {
                    sessionStorage.setItem("token", data.accessToken);
                }
            }

            router.push("/contests");
        } catch (err: any) {
            setError(err.message || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-black text-cream flex overflow-hidden relative"
            style={{ fontFamily: "'Syne', sans-serif" }}
        >
            {/* Animated gradient */}
            <div
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                    background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(200,241,53,0.15), transparent 40%)`,
                }}
            />

            {/* Noise overlay */}
            <div
                className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
                }}
            />

            {/* Left panel — Branding */}
            <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-16 relative bg-gradient-to-br from-black via-slate to-black border-r border-white/[0.06]">
                <div className="relative z-10">
                    <Link
                        href="/"
                        className="inline-flex items-baseline gap-1 text-cream hover:text-acid transition-colors no-underline"
                    >
                        <span
                            className="text-[3.5rem] font-extrabold tracking-[4px] leading-none"
                            style={{ fontFamily: "'Bebas Neue', cursive" }}
                        >
                            Arena<span className="text-acid">X</span>
                        </span>
                    </Link>
                    <p className="text-muted text-sm mt-3 max-w-md leading-relaxed">
                        Welcome back. Log in to continue your competitive journey.
                    </p>
                </div>

                {/* Feature highlights */}
                <div className="space-y-5 relative z-10">
                    {[
                        { icon: "⚡", text: "Live contests running 24/7", delay: 0 },
                        { icon: "🏆", text: "Compete for real prizes", delay: 100 },
                        { icon: "📊", text: "Track your global ranking", delay: 200 },
                        { icon: "🎯", text: "AI-powered challenge scoring", delay: 300 },
                    ].map((feat, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-4 opacity-0 animate-fade-up group"
                            style={{ animationDelay: `${feat.delay}ms`, animationFillMode: "forwards" }}
                        >
                            <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                {feat.icon}
                            </div>
                            <div className="text-cream/80 text-sm group-hover:text-cream transition-colors">
                                {feat.text}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Decorative glow */}
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-acid/5 rounded-full blur-[120px]" />
            </div>

            {/* Right panel — Form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
                <div className="w-full max-w-md space-y-8 relative z-10">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <Link href="/" className="inline-block">
                            <span
                                className="text-[2.5rem] font-extrabold tracking-[3px] text-cream"
                                style={{ fontFamily: "'Bebas Neue', cursive" }}
                            >
                                Arena<span className="text-acid">X</span>
                            </span>
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1
                            className="text-cream font-extrabold leading-tight"
                            style={{
                                fontFamily: "'Bebas Neue', cursive",
                                fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
                            }}
                        >
                            Welcome Back
                        </h1>
                        <p className="text-muted text-sm">
                            Don&apos;t have an account?{" "}
                            <Link href="/signup" className="text-acid hover:underline font-semibold">
                                Sign up
                            </Link>
                        </p>
                    </div>

                    {/* Social login (optional - comment out if not using) */}
                    <div className="space-y-3">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/[0.08]" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-black px-3 text-muted font-mono tracking-widest">
                                    Quick Sign In
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                className="flex items-center justify-center gap-2 bg-white/[0.04] border border-white/[0.1] rounded-lg px-4 py-3 text-cream text-sm font-semibold hover:bg-white/[0.08] hover:border-white/[0.2] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                disabled
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                                    />
                                </svg>
                                GitHub
                            </button>
                            <button
                                type="button"
                                className="flex items-center justify-center gap-2 bg-white/[0.04] border border-white/[0.1] rounded-lg px-4 py-3 text-cream text-sm font-semibold hover:bg-white/[0.08] hover:border-white/[0.2] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                disabled
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Google
                            </button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/[0.08]" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-black px-3 text-muted font-mono tracking-widest">Or</span>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-2">
                            <label
                                htmlFor="email"
                                className="block font-mono text-[0.7rem] text-muted tracking-[2px] uppercase"
                            >
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full bg-white/[0.04] border border-white/[0.12] rounded-lg px-4 py-3.5 text-cream text-sm outline-none focus:border-acid/50 focus:bg-white/[0.06] transition-all placeholder:text-muted/40"
                                placeholder="you@example.com"
                                autoComplete="email"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="password"
                                    className="block font-mono text-[0.7rem] text-muted tracking-[2px] uppercase"
                                >
                                    Password
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-[0.7rem] text-acid hover:underline font-mono"
                                >
                                    Forgot?
                                </Link>
                            </div>
                            <input
                                id="password"
                                type="password"
                                required
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="w-full bg-white/[0.04] border border-white/[0.12] rounded-lg px-4 py-3.5 text-cream text-sm outline-none focus:border-acid/50 focus:bg-white/[0.06] transition-all placeholder:text-muted/40"
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                        </div>

                        {/* Remember me */}
                        <div className="flex items-center">
                            <input
                                id="remember"
                                type="checkbox"
                                checked={form.remember}
                                onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                                className="w-4 h-4 rounded border-white/[0.12] bg-white/[0.04] text-acid focus:ring-acid focus:ring-offset-0 focus:ring-2 cursor-pointer"
                            />
                            <label htmlFor="remember" className="ml-2.5 text-sm text-muted cursor-pointer">
                                Remember me for 30 days
                            </label>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-acid text-black font-extrabold text-sm tracking-[2px] uppercase py-4 rounded-lg hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 transition-all duration-200 shadow-[0_8px_24px_rgba(200,241,53,0.3)] flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    Signing In...
                                </>
                            ) : (
                                "Sign In →"
                            )}
                        </button>
                    </form>

                    {/* Support link */}
                    <p className="text-center text-[0.7rem] text-muted/60">
                        Having trouble?{" "}
                        <Link href="/support" className="text-cream hover:text-acid transition-colors">
                            Contact support
                        </Link>
                    </p>
                </div>
            </div>

            <style jsx global>{`
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-up {
          animation: fade-up 0.8s ease-out;
        }
      `}</style>
        </div>
    );
}