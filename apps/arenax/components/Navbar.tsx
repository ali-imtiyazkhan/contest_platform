"use client";

import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

const navLinks: { label: string; href: string }[] = [
  { label: "Contests", href: "/contests" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Challenges", href: "#" },
  { label: "Prizes", href: "#" },
];

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-12 py-5 bg-[var(--header-bg)] backdrop-blur-[18px] border-b border-[var(--border-primary)]">
      {/* Logo */}
      <div
        className="text-[2rem] tracking-[3px] text-[var(--text-primary)]"
        style={{ fontFamily: "'Bebas Neue', cursive" }}
      >
        Arena<span className="text-[var(--accent)]">X</span>
      </div>

      {/* Nav Links */}
      <ul className="hidden md:flex gap-9 list-none">
        {navLinks.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-[0.78rem] font-bold uppercase tracking-[2px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200 no-underline"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all hover:bg-[var(--bg-card-hover)] border border-[var(--border-secondary)] bg-[var(--bg-card)] text-[var(--text-primary)]"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? "☀" : "🌙"}
        </button>

        {/* CTA */}
        <Link
          href="/contests"
          className="bg-[var(--accent)] text-[var(--accent-text-on)] px-6 py-[10px] rounded-sm text-[0.78rem] font-extrabold tracking-[2px] uppercase no-underline hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200 font-syne"
        >
          Enter Arena →
        </Link>
      </div>
    </nav>
  );
}
