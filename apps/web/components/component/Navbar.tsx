import Link from "next/link";

const navLinks: { label: string; href: string }[] = [
  { label: "Contests",     href: "/contests" },
  { label: "Leaderboard",  href: "#" },
  { label: "Challenges",   href: "#" },
  { label: "Prizes",       href: "#" },
];

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-12 py-5 bg-black/85 backdrop-blur-[18px] border-b border-white/[0.06]">
      {/* Logo */}
      <div
        className="text-[2rem] tracking-[3px] text-cream"
        style={{ fontFamily: "'Bebas Neue', cursive" }}
      >
        Arena<span className="text-acid">X</span>
      </div>

      {/* Nav Links */}
      <ul className="hidden md:flex gap-9 list-none">
        {navLinks.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-[0.78rem] font-bold uppercase tracking-[2px] text-muted hover:text-cream transition-colors duration-200 no-underline"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href="#"
        className="bg-acid text-black px-6 py-[10px] rounded-sm text-[0.78rem] font-extrabold tracking-[2px] uppercase no-underline hover:bg-cream hover:-translate-y-0.5 transition-all duration-200"
      >
        Enter Arena →
      </Link>
    </nav>
  );
}
