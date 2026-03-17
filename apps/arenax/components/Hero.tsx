"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface StatItem {
  num: string;
  suffix: string;
  label: string;
}

const stats: StatItem[] = [
  { num: "12", suffix: "K+", label: "Competitors" },
  { num: "340", suffix: "+", label: "Contests Run" },
  { num: "$50", suffix: "K", label: "Prizes Awarded" },
];

const avatars = [
  { letter: "A", bg: "bg-[#4f86f7]" },
  { letter: "B", bg: "bg-[#e8554e]" },
  { letter: "C", bg: "bg-[#f5a623]" },
  { letter: "D", bg: "bg-[#7ed321]" },
];

export default function Hero() {
  const [seconds, setSeconds] = useState(158);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `⏱ ${m}:${sec}`;
  };

  return (
    <section className="min-h-screen grid grid-cols-1 md:grid-cols-2 relative overflow-hidden hero-divider">
      {/* Left Panel */}
      <div className="bg-[var(--bg-primary)] flex flex-col justify-center px-16 pt-40 pb-20 relative z-[2]">
        <p
          className="text-[var(--accent)] text-[0.75rem] tracking-[3px] uppercase mb-6 hero-animate animate-fade-up-1"
          style={{ fontFamily: "var(--font-dm-mono)" }}
        >
          // The Ultimate Contest Platform
        </p>

        <h1
          className="text-[var(--text-primary)] leading-[0.92] hero-animate animate-fade-up-2"
          style={{
            fontFamily: "var(--font-bebas)",
            fontSize: "clamp(4rem, 7vw, 7.5rem)",
          }}
        >
          Read.
          <br />
          Think.
          <br />
          <span className="text-[var(--accent)]">Conquer.</span>
        </h1>

        <p className="mt-7 text-base leading-[1.7] text-[var(--text-muted)] max-w-[400px] hero-animate animate-fade-up-3">
          Enter live contests. Face real challenges. Answer in real-time —
          question on one side, your answer on the other. Only the sharpest
          minds win.
        </p>

        <div className="flex gap-4 mt-11 hero-animate animate-fade-up-4">
          <Link
            href="/contests"
            className="bg-[var(--accent)] text-[var(--accent-text-on)] px-9 py-4 rounded-sm text-[0.85rem] font-extrabold tracking-[2px] uppercase no-underline inline-flex items-center gap-2.5 hover:-translate-y-[3px] hover:shadow-[0_12px_30px_rgba(200,241,53,0.35)] transition-all duration-200 font-syne"
          >
            Join a Contest →
          </Link>
          <Link
            href="#process"
            className="bg-transparent text-[var(--text-primary)] px-9 py-4 rounded-sm border border-[var(--border-secondary)] text-[0.85rem] font-bold tracking-[2px] uppercase no-underline hover:border-[var(--text-primary)] hover:-translate-y-[3px] transition-all duration-200 font-syne"
          >
            See How It Works
          </Link>
        </div>

        {/* Stats */}
        <div className="flex gap-10 mt-15 hero-animate animate-fade-up-5">
          {stats.map((s) => (
            <div key={s.label}>
              <div
                className="text-[var(--text-primary)] text-[2.4rem] leading-none"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                {s.num}
                <span className="text-[var(--accent)]">{s.suffix}</span>
              </div>
              <div
                className="text-[0.7rem] text-[var(--text-muted)] uppercase tracking-[2px] mt-1"
                style={{ fontFamily: "var(--font-dm-mono)" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Challenge Preview */}
      <div className="hidden md:flex bg-[var(--bg-tertiary)] items-center justify-center px-12 pt-36 pb-20 border-l border-[var(--border-primary)] relative">
        <div
          className="w-full max-w-[520px] bg-[var(--bg-secondary)] rounded-lg overflow-hidden border border-[var(--border-secondary)] shadow-[0_40px_80px_rgba(0,0,0,0.2)] hero-animate animate-slide-in"
        >
          {/* Card Header */}
          <div className="bg-[var(--accent-bg)] border-b border-[var(--accent-border)] px-5 py-3.5 flex items-center gap-3">
            <span
              className="text-[var(--accent-text-on)] bg-[var(--accent)] px-2.5 py-1 rounded-sm text-[0.65rem] font-medium tracking-[2px] uppercase"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              Live Now
            </span>
            <span
              className="text-[0.72rem] text-[var(--text-muted)]"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              Challenge #47 — Logic Masters
            </span>
            <span
              className="ml-auto text-[var(--accent)] text-[0.75rem]"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              {formatTime(seconds)}
            </span>
          </div>

          {/* Card Body — Split */}
          <div className="grid grid-cols-2 min-h-[320px]">
            {/* Question Side */}
            <div className="p-7 border-r border-[var(--border-primary)] flex flex-col gap-4">
              <span
                className="text-[0.65rem] text-[var(--text-muted)] tracking-[2px] uppercase"
                style={{ fontFamily: "var(--font-dm-mono)" }}
              >
                // Question
              </span>
              <p className="text-[0.95rem] leading-[1.6] text-[var(--text-primary)] font-semibold">
                A train travels 120 km in 1.5 hours. If it increases speed by
                20%, how long will it take to cover 200 km?
              </p>
              <p className="text-[0.78rem] text-[var(--text-muted)] leading-[1.5] italic">
                Hint: Calculate the new speed first, then apply it to the new
                distance.
              </p>
            </div>

            {/* Answer Side */}
            <div className="p-7 flex flex-col gap-3">
              <span
                className="text-[0.65rem] text-[var(--text-muted)] tracking-[2px] uppercase"
                style={{ fontFamily: "var(--font-dm-mono)" }}
              >
                // Your Answer
              </span>
              <textarea
                className="flex-1 bg-[var(--input-bg)] border border-[var(--border-secondary)] rounded-md p-3.5 text-[0.82rem] text-[var(--text-primary)] leading-[1.6] resize-none outline-none focus:border-[var(--accent-border)] transition-colors caret-[var(--accent)] placeholder:text-[var(--text-muted)] placeholder:italic"
                style={{ fontFamily: "var(--font-dm-mono)" }}
                placeholder="Type your answer here..."
              />
              <button className="bg-[var(--accent)] text-[var(--accent-text-on)] rounded py-2.5 text-[0.78rem] font-extrabold tracking-[1.5px] uppercase hover:opacity-85 transition-opacity font-syne">
                Submit →
              </button>
            </div>
          </div>

          {/* Card Footer */}
          <div className="px-6 py-3.5 border-t border-[var(--border-primary)] flex items-center justify-between">
            <div className="flex items-center gap-2 text-[0.72rem] text-[var(--text-muted)]">
              <div className="flex">
                {avatars.map((av) => (
                  <div
                    key={av.letter}
                    className={`w-6 h-6 rounded-full border-2 border-[var(--bg-secondary)] -ml-1.5 first:ml-0 ${av.bg} text-[0.6rem] flex items-center justify-center text-white font-bold`}
                  >
                    {av.letter}
                  </div>
                ))}
              </div>
              <span>+2,841 competing</span>
            </div>
            <span
              className="text-[var(--accent)] text-[0.72rem]"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              +500 pts
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
