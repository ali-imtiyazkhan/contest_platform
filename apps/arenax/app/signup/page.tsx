"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export default function SignUpPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        handle: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener("mousemove", handleMove);
        return () => window.removeEventListener("mousemove", handleMove);
    }, []);

    useEffect(() => {
        const pw = form.password;
        let strength = 0;
        if (pw.length > 6) strength++;
        if (pw.length > 10) strength++;
        if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) strength++;
        if (/\d/.test(pw)) strength++;
        if (/[^A-Za-z0-9]/.test(pw)) strength++;
        setPasswordStrength(strength);
    }, [form.password]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (form.password !== form.confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        if (form.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        if (!form.handle || form.handle.length < 3) {
            setError("Handle must be at least 3 characters");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/user/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                    username: form.handle,
                }),
            });

            const data = await res.json();

            console.log("data is : ", data);

            if (!res.ok) {
                throw new Error(data.message || "Sign up failed");
            }

            if (data.token) {
                localStorage.setItem("token", data.token);
            }

            router.push("/contests");
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const strengthColors = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e"];
    const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Excellent"];

    return (
        <div
            className="min-h-screen bg-black text-cream flex overflow-hidden relative"
            style={{ fontFamily: "'Syne', sans-serif" }}
        >
            {/* Animated gradient background */}
            <div
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                    background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(200,241,53,0.15), transparent 40%)`,
                }}
            />

            {/* Noise texture overlay */}
            <div
                className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
                }}
            />

            {/* Left panel — Hero / Branding */}
            <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-16 relative bg-gradient-to-br from-black via-slate to-black border-r border-white/[0.06]">
                <div className="relative z-10">
                    <Link
                        href="/"
                        className="inline-flex items-baseline gap-1 text-cream hover:text-acid transition-colors no-underline group"
                    >
                        <span
                            className="text-[3.5rem] font-extrabold tracking-[4px] leading-none"
                            style={{ fontFamily: "'Bebas Neue', cursive" }}
                        >
                            Arena<span className="text-acid">X</span>
                        </span>
                    </Link>
                    <p className="text-muted text-sm mt-3 max-w-md leading-relaxed">
                        The ultimate competitive platform for coders, writers, and problem-solvers.
                        Join thousands competing for glory.
                    </p>
                </div>

                {/* Animated stats */}
                <div className="space-y-6 relative z-10">
                    {[
                        { num: "12,400+", label: "Active Competitors", delay: 0 },
                        { num: "$150K+", label: "Total Prizes Awarded", delay: 100 },
                        { num: "340+", label: "Contests Hosted", delay: 200 },
                    ].map((stat, i) => (
                        <div
                            key={i}
                            className="flex items-baseline gap-3 opacity-0 animate-fade-up"
                            style={{ animationDelay: `${stat.delay}ms`, animationFillMode: "forwards" }}
                        >
                            <div
                                className="text-acid font-extrabold text-4xl leading-none"
                                style={{ fontFamily: "'Bebas Neue', cursive" }}
                            >
                                {stat.num}
                            </div>
                            <div className="text-muted text-sm font-mono tracking-wider uppercase">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Decorative element */}
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
                            style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}
                        >
                            Create Account
                        </h1>
                        <p className="text-muted text-sm">
                            Already have an account?{" "}
                            <Link href="/login" className="text-acid hover:underline font-semibold">
                                Sign in
                            </Link>
                        </p>
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
                            />
                        </div>

                        {/* Handle */}
                        <div className="space-y-2">
                            <label
                                htmlFor="handle"
                                className="block font-mono text-[0.7rem] text-muted tracking-[2px] uppercase"
                            >
                                Arena Handle
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-acid font-mono text-sm">
                                    @
                                </span>
                                <input
                                    id="handle"
                                    type="text"
                                    required
                                    value={form.handle}
                                    onChange={(e) =>
                                        setForm({ ...form, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })
                                    }
                                    className="w-full bg-white/[0.04] border border-white/[0.12] rounded-lg pl-9 pr-4 py-3.5 text-cream text-sm outline-none focus:border-acid/50 focus:bg-white/[0.06] transition-all placeholder:text-muted/40"
                                    placeholder="yourhandle"
                                />
                            </div>
                            <p className="text-[0.7rem] text-muted/60 font-mono">
                                Lowercase letters, numbers, and underscores only
                            </p>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label
                                htmlFor="password"
                                className="block font-mono text-[0.7rem] text-muted tracking-[2px] uppercase"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="w-full bg-white/[0.04] border border-white/[0.12] rounded-lg px-4 py-3.5 text-cream text-sm outline-none focus:border-acid/50 focus:bg-white/[0.06] transition-all placeholder:text-muted/40"
                                placeholder="••••••••"
                            />
                            {/* Password strength */}
                            {form.password && (
                                <div className="space-y-1.5">
                                    <div className="flex gap-1">
                                        {[0, 1, 2, 3, 4].map((i) => (
                                            <div
                                                key={i}
                                                className="h-1 flex-1 rounded-full bg-white/[0.08] overflow-hidden"
                                            >
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

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <label
                                htmlFor="confirmPassword"
                                className="block font-mono text-[0.7rem] text-muted tracking-[2px] uppercase"
                            >
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                required
                                value={form.confirmPassword}
                                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                className="w-full bg-white/[0.04] border border-white/[0.12] rounded-lg px-4 py-3.5 text-cream text-sm outline-none focus:border-acid/50 focus:bg-white/[0.06] transition-all placeholder:text-muted/40"
                                placeholder="••••••••"
                            />
                            {form.confirmPassword && form.password !== form.confirmPassword && (
                                <p className="text-[0.7rem] text-red-400 font-mono">Passwords don't match</p>
                            )}
                        </div>

                        {/* Error message */}
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
                                    Creating Account...
                                </>
                            ) : (
                                "Create Account →"
                            )}
                        </button>

                        {/* Terms */}
                        <p className="text-center text-[0.7rem] text-muted/60 leading-relaxed">
                            By signing up, you agree to our{" "}
                            <Link href="/terms" className="text-cream hover:text-acid transition-colors">
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link href="/privacy" className="text-cream hover:text-acid transition-colors">
                                Privacy Policy
                            </Link>
                        </p>
                    </form>
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