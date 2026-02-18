interface ChallengeType {
  emoji: string;
  title: string;
  description: string;
  tag: string;
}

const challengeTypes: ChallengeType[] = [
  {
    emoji: "🧮",
    title: "Math & Logic",
    description:
      "Quantitative reasoning, number theory, and pure problem-solving under the clock. No guessing — only precision wins.",
    tag: "Analytical",
  },
  {
    emoji: "✍️",
    title: "Writing & Creativity",
    description:
      "Prompts that demand originality, voice, and storytelling. Judges evaluate quality, not just speed.",
    tag: "Creative",
  },
  {
    emoji: "🌍",
    title: "General Knowledge",
    description:
      "History, science, culture, geography. The broadest arena — where well-rounded minds shine brightest.",
    tag: "Knowledge",
  },
  {
    emoji: "💻",
    title: "Tech & Coding",
    description:
      "Algorithmic challenges, debug puzzles, and system design questions for developers and engineers.",
    tag: "Technical",
  },
];

export default function ChallengeTypes() {
  return (
    <section className="px-16 pb-[120px]">
      <p
        className="reveal text-acid text-[0.72rem] tracking-[3px] uppercase mb-4"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        // Challenge Types
      </p>
      <h2
        className="reveal mb-[60px] leading-none"
        style={{
          fontFamily: "'Bebas Neue', cursive",
          fontSize: "clamp(3rem, 5vw, 5rem)",
        }}
      >
        Every Kind of Mind <br />
        Has a Stage
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[2px]">
        {challengeTypes.map((type) => (
          <div
            key={type.title}
            className="reveal type-card bg-slate hover:bg-mid px-12 py-14 relative overflow-hidden cursor-pointer transition-colors duration-300"
          >
            <div className="text-[2.5rem] mb-5">{type.emoji}</div>
            <h3 className="text-[1.5rem] font-extrabold mb-3">{type.title}</h3>
            <p className="text-[0.88rem] text-muted leading-[1.7] max-w-[380px]">
              {type.description}
            </p>
            <span
              className="inline-block mt-5 text-acid border border-acid/30 px-3 py-[5px] rounded-sm text-[0.65rem] tracking-[2px] uppercase"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {type.tag}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
