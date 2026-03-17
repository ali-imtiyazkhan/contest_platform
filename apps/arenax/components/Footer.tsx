import Link from "next/link";

const footerLinks = [
  "About",
  "Contests",
  "Leaderboard",
  "Prizes",
  "Privacy",
  "Contact",
] as const;

export default function Footer() {
  return (
    <footer className="px-16 py-12 border-t border-[var(--border-primary)] flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left bg-[var(--bg-primary)]">
      <div
        className="text-[var(--text-primary)] text-[1.5rem] tracking-[3px]"
        style={{ fontFamily: "var(--font-bebas)" }}
      >
        100x<span className="text-[var(--accent)]">Contest</span>
      </div>

      <div className="flex flex-wrap justify-center gap-7">
        {footerLinks.map((link) => (
          <Link
            key={link}
            href="#"
            className="text-[var(--text-muted)] text-[0.75rem] tracking-[1.5px] uppercase no-underline hover:text-[var(--text-primary)] transition-colors duration-200"
          >
            {link}
          </Link>
        ))}
      </div>

      <div
        className="text-[var(--text-muted)] text-[0.7rem]"
        style={{ fontFamily: "var(--font-dm-mono)" }}
      >
        © 2025 100xContest. All rights reserved.
      </div>
    </footer>
  );
}
