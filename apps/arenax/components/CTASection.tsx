"use client";

import { useState } from "react";

export default function CTASection() {
  const [email, setEmail] = useState("");

  const handleSubmit = () => {
    if (!email) return;
    alert(`You're in! We'll notify ${email} when the next contest opens.`);
    setEmail("");
  };

  return (
    <section className="cta-watermark bg-slate px-16 py-[160px] text-center relative overflow-hidden">
      <p
        className="reveal text-acid text-[0.72rem] tracking-[3px] uppercase mb-4"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        // Join Now
      </p>
      <h2
        className="reveal mb-6 leading-none"
        style={{
          fontFamily: "'Bebas Neue', cursive",
          fontSize: "clamp(3.5rem, 6vw, 6rem)",
        }}
      >
        Ready to
        <br />
        <span className="text-acid">Compete?</span>
      </h2>

      <p className="reveal text-[1.05rem] text-muted max-w-[500px] mx-auto mb-12">
        Drop your email and we&apos;ll notify you when the next contest opens.
        First 500 signups get free Pro access for 30 days.
      </p>

      <div className="reveal flex flex-col sm:flex-row gap-3 justify-center max-w-[480px] mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="your@email.com"
          className="flex-1 bg-white/[0.06] border border-white/[0.12] rounded text-cream px-5 py-4 text-[0.9rem] outline-none focus:border-acid placeholder:text-muted transition-colors"
          style={{ fontFamily: "'Syne', sans-serif" }}
        />
        <button
          onClick={handleSubmit}
          className="bg-acid text-black border-none rounded px-7 py-4 font-extrabold text-[0.82rem] tracking-[1.5px] uppercase whitespace-nowrap cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(200,241,53,0.3)] transition-all duration-200"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Join Free →
        </button>
      </div>
    </section>
  );
}
