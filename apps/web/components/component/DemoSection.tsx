interface MetaItem {
  label: string;
}

const metaItems: MetaItem[] = [
  { label: "Category: World History" },
  { label: "Points: 750" },
  { label: "Time Limit: 4:00 minutes" },
  { label: "Difficulty: Intermediate" },
];

export default function DemoSection() {
  return (
    <section className="bg-slate px-16 py-[120px]">
      <p
        className="reveal text-acid text-[0.72rem] tracking-[3px] uppercase mb-4 text-center"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        // The Interface
      </p>
      <h2
        className="reveal text-center max-w-[600px] mx-auto mb-14 leading-none"
        style={{
          fontFamily: "'Bebas Neue', cursive",
          fontSize: "clamp(3rem, 5vw, 5rem)",
        }}
      >
        Your Arena:
        <br />
        Split-Screen. Focused. Fast.
      </h2>

      {/* Browser-style window */}
      <div className="reveal max-w-[900px] mx-auto bg-black rounded-[10px] border border-white/[0.08] overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,0.6)]">
        {/* Window bar */}
        <div className="bg-mid px-5 py-3 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <span className="w-3 h-3 rounded-full bg-[#28ca41]" />
          <span
            className="ml-3 text-[0.72rem] text-muted"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            arenax.io — Challenge #47 / Part 3 of 5
          </span>
        </div>

        {/* Split body */}
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[400px]">
          {/* Question side */}
          <div className="p-10 border-b md:border-b-0 md:border-r border-white/[0.06]">
            <span
              className="block text-acid text-[0.65rem] tracking-[2px] uppercase mb-5"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              📖 Question
            </span>
            <p className="text-[1.15rem] font-bold leading-[1.55] mb-7 text-cream">
              &quot;Describe in 3–5 sentences how the Industrial Revolution
              changed the concept of human labor and what long-term social
              effects it created.&quot;
            </p>
            <div
              className="flex flex-col gap-2.5 text-[0.75rem] text-muted"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {metaItems.map((item) => (
                <span key={item.label} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-acid" />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          {/* Answer side */}
          <div className="p-10 flex flex-col gap-4">
            <span
              className="text-muted text-[0.65rem] tracking-[2px] uppercase"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              ✏️ Your Answer
            </span>
            <textarea
              className="demo-textarea flex-1 bg-white/[0.04] border border-acid/30 rounded-md p-4.5 text-[0.82rem] text-cream leading-[1.6] resize-none outline-none placeholder:text-muted"
              style={{ fontFamily: "'DM Mono', monospace" }}
              defaultValue="The Industrial Revolution fundamentally shifted..."
            />
            <button className="bg-acid text-black border-none py-3.5 rounded font-extrabold text-[0.82rem] tracking-[1.5px] uppercase cursor-pointer hover:opacity-85 transition-opacity">
              Submit Answer →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
