"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BACKEND_URL as API_BASE } from "@/config";

export default function SignUpPage() {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener("mousemove", handleMove);
        return () => window.removeEventListener("mousemove", handleMove);
    }, []);

    const handleGoogleLogin = () => {
        window.location.href = `${API_BASE}/auth/google`;
    };

    const handleGithubLogin = () => {
        window.location.href = `${API_BASE}/auth/github`;
    };

    return (
        <div
            className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex overflow-hidden relative selection:bg-[var(--accent-bg)] selection:text-[var(--accent)]"
            style={{ fontFamily: "'Syne', sans-serif" }}
        >
            {/* Animated gradient background */}
            <div
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                    background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, var(--accent-bg), transparent 40%)`,
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
            <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-16 relative bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)] border-r border-[var(--border-primary)]">
                <div className="relative z-10">
                    <Link
                        href="/"
                        className="inline-flex items-baseline gap-1 text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors no-underline group"
                    >
                        <span
                            className="text-[3.5rem] font-extrabold tracking-[4px] leading-none"
                            style={{ fontFamily: "'Bebas Neue', cursive" }}
                        >
                            Arena<span className="text-[var(--accent)]">X</span>
                        </span>
                    </Link>
                    <p className="text-[var(--text-muted)] text-sm mt-3 max-w-md leading-relaxed">
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
                                className="text-[var(--accent)] font-extrabold text-4xl leading-none"
                                style={{ fontFamily: "'Bebas Neue', cursive" }}
                            >
                                {stat.num}
                            </div>
                            <div className="text-[var(--text-muted)] text-sm font-mono tracking-wider uppercase">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Decorative element */}
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[var(--accent)] opacity-5 rounded-full blur-[120px]" />
            </div>

            {/* Right panel — Form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
                <div className="w-full max-w-md space-y-8 relative z-10">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <Link href="/" className="inline-block">
                            <span
                                className="text-[2.5rem] font-extrabold tracking-[3px] text-[var(--text-primary)]"
                                style={{ fontFamily: "'Bebas Neue', cursive" }}
                            >
                                Arena<span className="text-[var(--accent)]">X</span>
                            </span>
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1
                            className="text-[var(--text-primary)] font-extrabold leading-tight"
                            style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}
                        >
                            Join the Arena
                        </h1>
                        <p className="text-[var(--text-muted)] text-sm">
                            Already have an account?{" "}
                            <Link href="/signin" className="text-[var(--accent)] hover:underline font-semibold">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    {/* OAuth buttons */}
                    <div className="space-y-4">
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-lg hover:bg-gray-100 transition-all duration-200"
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
                            Continue with Google
                        </button>

                        <button
                            onClick={handleGithubLogin}
                            className="w-full flex items-center justify-center gap-3 bg-[#24292e] text-white font-bold py-4 rounded-lg hover:bg-[#2c3238] transition-all duration-200"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.372.79 1.102.79 2.222v3.293c0 .319.232.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                                />
                            </svg>
                            Continue with GitHub
                        </button>
                    </div>

                    {/* Terms */}
                    <p className="text-center text-[0.7rem] text-[var(--text-muted)] opacity-60 leading-relaxed">
                        By signing up, you agree to our{" "}
                        <Link href="/terms" className="text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors">
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
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
      ` }} />
        </div>
    );
}
