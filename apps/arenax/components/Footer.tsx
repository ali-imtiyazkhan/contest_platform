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
    <footer className="px-16 py-12 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
      <div
        className="text-cream text-[1.5rem] tracking-[3px]"
        style={{ fontFamily: "'Bebas Neue', cursive" }}
      >
        Arena<span className="text-acid">X</span>
      </div>

      <div className="flex flex-wrap justify-center gap-7">
        {footerLinks.map((link) => (
          <Link
            key={link}
            href="#"
            className="text-muted text-[0.75rem] tracking-[1.5px] uppercase no-underline hover:text-cream transition-colors duration-200"
          >
            {link}
          </Link>
        ))}
      </div>

      <div
        className="text-muted text-[0.7rem]"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        © 2025 ArenaX. All rights reserved.
      </div>
    </footer>
  );
}
