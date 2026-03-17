interface Step {
  num: string;
  icon: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    num: "01",
    icon: "🏟️",
    title: "Join a Contest",
    description:
      "Browse live and upcoming contests. Each one is a themed arena with its own set of challenges, rules, and prize pool.",
  },
  {
    num: "02",
    icon: "⚡",
    title: "Face the Challenge",
    description:
      "Every challenge opens in a split-screen view: the question on the left, your answer space on the right. Read, think, write. No distractions.",
  },
  {
    num: "03",
    icon: "🏆",
    title: "Climb & Win",
    description:
      "Earn points for speed and accuracy. Top performers rise on the leaderboard and claim prizes at the end of each contest.",
  },
];

export default function HowItWorks() {
  return (
    <section className="px-16 py-[120px]">
      <p
        className="reveal text-[var(--accent)] text-[0.72rem] tracking-[3px] uppercase mb-4"
        style={{ fontFamily: "var(--font-dm-mono)" }}
      >
        // Process
      </p>
      <h2
        className="reveal mb-[60px] leading-none text-[var(--text-primary)]"
        style={{
          fontFamily: "var(--font-bebas)",
          fontSize: "clamp(3rem, 5vw, 5rem)",
        }}
      >
        How It Works
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-[2px]">
        {steps.map((step) => (
          <div
            key={step.num}
            id="process"
            className="reveal step-card bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] px-10 py-12 relative overflow-hidden transition-colors duration-300 group"
          >
            {/* Background number */}
            <span
              className="absolute top-[-10px] right-6 text-[6rem] leading-none text-[var(--text-primary)] opacity-[0.04] pointer-events-none select-none"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              {step.num}
            </span>

            {/* Icon */}
            <div className="w-[52px] h-[52px] rounded bg-[var(--accent-bg)] border border-[var(--accent-border)] flex items-center justify-center text-[1.4rem] mb-6">
              {step.icon}
            </div>

            <h3 className="text-[1.2rem] font-extrabold mb-3 text-[var(--text-primary)]">{step.title}</h3>
            <p className="text-[0.88rem] text-[var(--text-muted)] leading-[1.7]">
              {step.description}
            </p>

            {/* Animated bar */}
            <div className="step-bar h-[3px] w-12 bg-[var(--accent)] rounded mt-7 transition-all duration-300" />
          </div>
        ))}
      </div>
    </section>
  );
}
