interface Prize {
  trophy: string;
  position: string;
  amount: string;
  title: string;
  description: string;
  featured?: boolean;
}

const prizes: Prize[] = [
  {
    trophy: "🥉",
    position: "3rd Place",
    amount: "$250",
    title: "Bronze Champion",
    description:
      "Cash prize + 100xContest merchandise + 3-month Pro membership.",
  },
  {
    trophy: "🥇",
    position: "1st Place",
    amount: "$2,500",
    title: "Grand Champion",
    description:
      "Top cash prize + Hall of Fame placement + Annual Pro membership + exclusive 100xContest trophy.",
    featured: true,
  },
  {
    trophy: "🥈",
    position: "2nd Place",
    amount: "$750",
    title: "Silver Champion",
    description:
      "Cash prize + 100xContest exclusive gear + 6-month Pro membership.",
  },
];

export default function Prizes() {
  return (
    <section className="px-16 py-[120px]">
      <p
        className="reveal text-[var(--accent)] text-[0.72rem] tracking-[3px] uppercase mb-4"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        // Rewards
      </p>
      <h2
        className="reveal mb-[60px] leading-none text-[var(--text-primary)]"
        style={{
          fontFamily: "'Bebas Neue', cursive",
          fontSize: "clamp(3rem, 5vw, 5rem)",
        }}
      >
        Win Real Prizes
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {prizes.map((prize) => (
          <div
            key={prize.position}
            className={`reveal p-11 rounded-md border transition-all duration-300 hover:-translate-y-1.5 ${prize.featured
              ? "bg-[var(--accent)] border-transparent text-[var(--accent-text-on)] shadow-[0_20px_50px_rgba(200,241,53,0.25)]"
              : "bg-transparent border-[var(--border-secondary)] hover:border-[var(--accent-border)]"
              }`}
          >
            <div className="text-[2rem] mb-5">{prize.trophy}</div>
            <p
              className={`text-[0.7rem] tracking-[2px] uppercase mb-4 ${prize.featured ? "opacity-60" : "text-[var(--text-muted)]"
                }`}
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {prize.position}
            </p>
            <div
              className={`text-[4rem] leading-none mb-3 ${prize.featured ? "text-[var(--accent-text-on)]" : "text-[var(--text-primary)]"
                }`}
              style={{ fontFamily: "'Bebas Neue', cursive" }}
            >
              {prize.amount}
            </div>
            <p
              className={`font-bold text-base mb-2.5 ${prize.featured ? "text-[var(--accent-text-on)]" : "text-[var(--text-primary)]"
                }`}
            >
              {prize.title}
            </p>
            <p
              className={`text-[0.82rem] leading-[1.6] ${prize.featured ? "opacity-70" : "text-[var(--text-muted)]"
                }`}
            >
              {prize.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
