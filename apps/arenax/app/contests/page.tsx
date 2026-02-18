"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CONTESTS, Contest, ContestStatus, ContestCategory } from "@/lib/contestData";

// ─────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────
function useCountdown(targetIso: string) {
  const calc = () => Math.max(0, Math.floor((new Date(targetIso).getTime() - Date.now()) / 1000));
  const [secs, setSecs] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setSecs(calc()), 1000);
    return () => clearInterval(id);
  });
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return { h, m, s, done: secs === 0 };
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function StatusBadge({ status }: { status: ContestStatus }) {
  const map = {
    live:      { label: "● Live Now",  cls: "bg-acid/15 text-acid border-acid/30" },
    upcoming:  { label: "◷ Upcoming",  cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
    completed: { label: "✓ Completed", cls: "bg-white/10 text-muted border-white/15" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`font-mono text-[0.65rem] tracking-[2px] uppercase px-2.5 py-1 rounded-sm border ${cls}`}>
      {label}
    </span>
  );
}

function DifficultyPip({ level }: { level: Contest["difficulty"] }) {
  const colors: Record<string, string> = {
    Beginner: "text-emerald-400", Intermediate: "text-amber-400",
    Advanced: "text-orange-400", Elite: "text-red-400",
  };
  return <span className={`font-mono text-[0.68rem] font-bold tracking-widest ${colors[level]}`}>{level}</span>;
}

// ─────────────────────────────────────────────
// Live Activity Feed
// ─────────────────────────────────────────────
function ActivityFeed({ contest }: { contest: Contest }) {
  const [events, setEvents] = useState(contest.activity);
  const [pulse, setPulse] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Simulate live events for live contests
  useEffect(() => {
    if (contest.status !== "live") return;
    const names = ["Alex R.", "Jordan K.", "Mia T.", "Sven L.", "Aria B.", "Omar H."];
    const actions = [
      { action: "just joined", points: undefined },
      { action: "submitted Challenge 1", points: 200 },
      { action: "submitted Challenge 2", points: 350 },
      { action: "scored a perfect answer", points: 500 },
    ];
    const colors = ["#4f86f7", "#e8554e", "#f5a623", "#a855f7", "#14b8a6", "#c8f135"];
    const id = setInterval(() => {
      const name = names[Math.floor(Math.random() * names.length)];
      const ev = actions[Math.floor(Math.random() * actions.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      setEvents(prev => [{
        id: String(Date.now()),
        user: name,
        avatar: name[0],
        avatarColor: color,
        action: ev.action,
        time: "just now",
        points: ev.points,
      }, ...prev].slice(0, 12));
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }, 3500 + Math.random() * 2000);
    return () => clearInterval(id);
  }, [contest.status]);

  return (
    <div className="flex flex-col h-full">
      <div className={`flex items-center justify-between mb-3 transition-opacity duration-300 ${pulse ? "opacity-100" : "opacity-80"}`}>
        <span className="font-mono text-[0.65rem] text-muted tracking-[2px] uppercase">Live Activity</span>
        {contest.status === "live" && (
          <span className="flex items-center gap-1.5 font-mono text-[0.65rem] text-acid">
            <span className="w-1.5 h-1.5 rounded-full bg-acid animate-ping" />
            Streaming
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
        {events.map((ev, i) => (
          <div
            key={ev.id}
            className={`flex items-start gap-2.5 p-2.5 rounded bg-white/[0.03] border border-white/[0.05] transition-all duration-500 ${i === 0 && contest.status === "live" ? "border-acid/20 bg-acid/[0.04]" : ""}`}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[0.6rem] font-bold text-black flex-shrink-0 mt-0.5"
              style={{ background: ev.avatarColor }}
            >
              {ev.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-cream text-[0.78rem] font-semibold">{ev.user}</span>
              <span className="text-muted text-[0.75rem]"> {ev.action}</span>
              {ev.points && (
                <span className="ml-1 text-acid text-[0.7rem] font-mono font-bold">+{ev.points}pts</span>
              )}
            </div>
            <span className="font-mono text-[0.6rem] text-muted flex-shrink-0 mt-0.5">{ev.time}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Challenge Timeline (steps inside a contest)
// ─────────────────────────────────────────────
function ChallengeTimeline({ contest }: { contest: Contest }) {
  const completedCount = contest.status === "completed" ? contest.challenges.length
    : contest.status === "live" ? Math.floor(contest.challenges.length / 2)
    : 0;

  return (
    <div>
      <span className="font-mono text-[0.65rem] text-muted tracking-[2px] uppercase block mb-3">Challenges</span>
      <div className="space-y-2">
        {contest.challenges.map((ch, i) => {
          const done = i < completedCount;
          const active = i === completedCount && contest.status === "live";
          return (
            <div
              key={ch.id}
              className={`flex items-center gap-3 p-3 rounded border transition-colors duration-200 ${
                active  ? "border-acid/40 bg-acid/[0.06]"
                : done  ? "border-white/[0.06] bg-white/[0.03] opacity-60"
                : "border-white/[0.04] bg-white/[0.02]"
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[0.65rem] font-bold flex-shrink-0 ${
                active ? "bg-acid text-black"
                : done  ? "bg-white/20 text-white"
                : "bg-white/[0.06] text-muted"
              }`}>
                {done ? "✓" : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[0.82rem] font-semibold truncate ${done ? "text-muted" : "text-cream"}`}>{ch.title}</p>
                <p className="font-mono text-[0.65rem] text-muted">{ch.type} · {ch.duration}</p>
              </div>
              <span className={`font-mono text-[0.7rem] font-bold flex-shrink-0 ${active ? "text-acid" : "text-muted"}`}>
                +{ch.points}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Countdown Block
// ─────────────────────────────────────────────
function CountdownBlock({ targetIso, label }: { targetIso: string; label: string }) {
  const { h, m, s } = useCountdown(targetIso);
  return (
    <div>
      <span className="font-mono text-[0.65rem] text-muted tracking-[2px] uppercase block mb-3">{label}</span>
      <div className="flex gap-2">
        {[{ v: h, l: "HRS" }, { v: m, l: "MIN" }, { v: s, l: "SEC" }].map(({ v, l }) => (
          <div key={l} className="flex-1 bg-black/40 border border-white/[0.08] rounded p-2 text-center">
            <div className="font-bebas text-[2rem] text-cream leading-none" style={{ fontFamily: "'Bebas Neue', cursive" }}>{pad(v)}</div>
            <div className="font-mono text-[0.55rem] text-muted tracking-widest mt-0.5">{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Register Modal
// ─────────────────────────────────────────────
function RegisterModal({ contest, onClose }: { contest: Contest; onClose: () => void }) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [form, setForm] = useState({ name: "", email: "", handle: "" });
  const [loading, setLoading] = useState(false);
  const { h, m, s } = useCountdown(contest.startTime);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.handle) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    setStep("success");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-[#111113] border border-white/[0.12] rounded-xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="bg-acid/[0.06] border-b border-acid/[0.12] px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[0.65rem] text-acid tracking-[2px] uppercase mb-1">Register for Contest</p>
            <h3 className="text-cream font-extrabold text-lg leading-tight">{contest.title}</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-cream transition-colors text-xl leading-none">✕</button>
        </div>

        {step === "form" ? (
          <>
            {/* Prize + timing info */}
            <div className="px-6 pt-5 pb-4 grid grid-cols-3 gap-3 border-b border-white/[0.06]">
              {[
                { label: "Prize Pool", value: contest.prize },
                { label: "Difficulty", value: contest.difficulty },
                { label: "Participants", value: `${contest.participants.toLocaleString()}` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/[0.04] rounded p-3 text-center">
                  <div className="font-mono text-[0.6rem] text-muted tracking-widest uppercase mb-1">{label}</div>
                  <div className="text-cream font-bold text-[0.9rem]">{value}</div>
                </div>
              ))}
            </div>

            {/* Countdown if upcoming */}
            {contest.status === "upcoming" && (
              <div className="px-6 pt-5">
                <CountdownBlock targetIso={contest.startTime} label="Starts in" />
              </div>
            )}

            {/* Form */}
            <div className="px-6 pt-5 pb-6 space-y-4">
              {[
                { id: "name", label: "Full Name", placeholder: "Your full name", type: "text" },
                { id: "email", label: "Email Address", placeholder: "you@example.com", type: "email" },
                { id: "handle", label: "Arena Handle", placeholder: "@yourhandle", type: "text" },
              ].map(({ id, label, placeholder, type }) => (
                <div key={id}>
                  <label className="font-mono text-[0.65rem] text-muted tracking-[2px] uppercase block mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={form[id as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-white/[0.05] border border-white/10 rounded px-4 py-3 text-cream text-sm outline-none focus:border-acid/50 placeholder:text-muted transition-colors"
                  />
                </div>
              ))}

              <button
                onClick={handleSubmit}
                disabled={loading || !form.name || !form.email || !form.handle}
                className="w-full bg-acid text-black font-extrabold text-[0.85rem] tracking-[2px] uppercase py-4 rounded mt-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Registering…
                  </span>
                ) : (
                  contest.status === "live" ? "Join Now →" : "Register & Get Notified →"
                )}
              </button>
              <p className="font-mono text-[0.65rem] text-muted text-center">Free to enter. No credit card required.</p>
            </div>
          </>
        ) : (
          /* Success state */
          <div className="px-8 py-12 text-center">
            <div className="w-16 h-16 bg-acid rounded-full flex items-center justify-center text-2xl mx-auto mb-5">✓</div>
            <h3 className="text-cream font-extrabold text-xl mb-2">You&apos;re registered!</h3>
            <p className="text-muted text-sm mb-1">Welcome to <span className="text-cream font-semibold">{contest.title}</span></p>
            <p className="font-mono text-[0.72rem] text-acid mb-8">
              {contest.status === "live"
                ? "Head in — the contest is live right now."
                : `Starting in ${pad(h)}h ${pad(m)}m ${pad(s)}s`}
            </p>
            {contest.status === "live" ? (
              <button
                onClick={onClose}
                className="bg-acid text-black font-extrabold text-[0.82rem] tracking-[2px] uppercase px-10 py-4 rounded hover:opacity-90 transition-opacity"
              >
                Enter Contest Arena →
              </button>
            ) : (
              <button
                onClick={onClose}
                className="border border-white/20 text-cream font-bold text-[0.82rem] tracking-[2px] uppercase px-10 py-3 rounded hover:border-white transition-colors"
              >
                Got it, I&apos;ll be there
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Contest Card (expanded panel on the right)
// ─────────────────────────────────────────────
function ContestDetailPanel({ contest, onRegister }: { contest: Contest; onRegister: () => void }) {
  const fillPct = Math.round((contest.participants / contest.maxParticipants) * 100);
  const totalPts = contest.challenges.reduce((a, c) => a + c.points, 0);

  return (
    <div className="h-full flex flex-col bg-[#111113] border-l border-white/[0.06] overflow-y-auto">
      {/* Panel header */}
      <div className="px-6 pt-6 pb-5 border-b border-white/[0.06] sticky top-0 bg-[#111113] z-10">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <StatusBadge status={contest.status} />
            <h2 className="text-cream font-extrabold text-xl mt-2 leading-tight">{contest.title}</h2>
            <p className="font-mono text-[0.68rem] text-muted mt-1">by {contest.host}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-acid font-extrabold text-2xl" style={{ fontFamily: "'Bebas Neue', cursive" }}>{contest.prize}</div>
            <div className="font-mono text-[0.62rem] text-muted tracking-widest uppercase">Prize Pool</div>
          </div>
        </div>
        <p className="text-muted text-[0.82rem] leading-[1.6]">{contest.description}</p>
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {contest.tags.map(t => (
            <span key={t} className="font-mono text-[0.62rem] text-muted border border-white/[0.08] px-2 py-0.5 rounded-sm">{t}</span>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-px bg-white/[0.04] border-b border-white/[0.06]">
        {[
          { label: "Participants", value: contest.participants.toLocaleString() },
          { label: "Total Points", value: totalPts.toLocaleString() },
          { label: "Difficulty", value: contest.difficulty },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#111113] px-4 py-3 text-center">
            <div className="font-mono text-[0.6rem] text-muted tracking-widest uppercase mb-1">{label}</div>
            <div className="text-cream font-bold text-sm">{value}</div>
          </div>
        ))}
      </div>

      {/* Participation bar */}
      <div className="px-6 py-4 border-b border-white/[0.06]">
        <div className="flex justify-between font-mono text-[0.65rem] text-muted mb-2">
          <span>Spots filled</span>
          <span>{fillPct}% · {contest.maxParticipants.toLocaleString()} max</span>
        </div>
        <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
          <div className="h-full bg-acid rounded-full transition-all duration-700" style={{ width: `${fillPct}%` }} />
        </div>
      </div>

      {/* Countdown (upcoming) or elapsed (live) */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        {contest.status === "upcoming" && <CountdownBlock targetIso={contest.startTime} label="Starts in" />}
        {contest.status === "live"     && <CountdownBlock targetIso={contest.endTime}   label="Time remaining" />}
        {contest.status === "completed" && (
          <div className="font-mono text-[0.72rem] text-muted">Contest ended · Results finalised</div>
        )}
      </div>

      {/* Challenge timeline */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <ChallengeTimeline contest={contest} />
      </div>

      {/* Activity feed */}
      <div className="px-6 py-5 flex-1 min-h-[260px] border-b border-white/[0.06]">
        <ActivityFeed contest={contest} />
      </div>

      {/* CTA */}
      <div className="px-6 py-5 sticky bottom-0 bg-[#111113] border-t border-white/[0.06]">
        {contest.status !== "completed" ? (
          <button
            onClick={onRegister}
            className="w-full bg-acid text-black font-extrabold text-[0.85rem] tracking-[2px] uppercase py-4 rounded hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200 shadow-[0_8px_24px_rgba(200,241,53,0.25)]"
          >
            {contest.status === "live" ? "Join Contest Now →" : "Register & Get Notified →"}
          </button>
        ) : (
          <div className="text-center font-mono text-[0.72rem] text-muted py-2">
            This contest has ended. <Link href="#" className="text-acid hover:underline">View results →</Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Contest Row (left list item)
// ─────────────────────────────────────────────
function ContestRow({ contest, selected, onClick }: { contest: Contest; selected: boolean; onClick: () => void }) {
  const fillPct = Math.round((contest.participants / contest.maxParticipants) * 100);
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-4 border-b border-white/[0.05] transition-all duration-200 group ${
        selected ? "bg-acid/[0.07] border-l-2 border-l-acid" : "hover:bg-white/[0.03] border-l-2 border-l-transparent"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-[0.9rem] truncate transition-colors ${selected ? "text-cream" : "text-cream/90 group-hover:text-cream"}`}>
            {contest.title}
          </p>
          <p className="font-mono text-[0.65rem] text-muted mt-0.5">{contest.category}</p>
        </div>
        <StatusBadge status={contest.status} />
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3">
          <DifficultyPip level={contest.difficulty} />
          <span className="font-mono text-[0.65rem] text-muted">{contest.participants.toLocaleString()} competing</span>
        </div>
        <span className="font-mono text-[0.72rem] text-acid font-bold">{contest.prize}</span>
      </div>
      {/* Mini progress bar */}
      <div className="h-0.5 bg-white/[0.06] rounded-full mt-3 overflow-hidden">
        <div className="h-full bg-acid/50 rounded-full" style={{ width: `${fillPct}%` }} />
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
const CATEGORIES: ContestCategory[] = ["All", "Math & Logic", "Writing", "General Knowledge", "Tech & Coding"];
const STATUS_TABS: { label: string; value: ContestStatus | "all" }[] = [
  { label: "All",       value: "all" },
  { label: "🔴 Live",    value: "live" },
  { label: "◷ Upcoming", value: "upcoming" },
  { label: "✓ Completed",value: "completed" },
];

export default function ContestsPage() {
  const [statusFilter, setStatusFilter] = useState<ContestStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<ContestCategory>("All");
  const [selectedId, setSelectedId] = useState<string>(CONTESTS[0].id);
  const [registerContest, setRegisterContest] = useState<Contest | null>(null);
  const [search, setSearch] = useState("");

  const filtered = CONTESTS.filter(c => {
    const matchStatus   = statusFilter === "all" || c.status === statusFilter;
    const matchCategory = categoryFilter === "All" || c.category === categoryFilter;
    const matchSearch   = !search || c.title.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchCategory && matchSearch;
  });

  const selected = CONTESTS.find(c => c.id === selectedId) ?? CONTESTS[0];

  const liveCnt     = CONTESTS.filter(c => c.status === "live").length;
  const upcomingCnt = CONTESTS.filter(c => c.status === "upcoming").length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-cream flex flex-col" style={{ fontFamily: "'Syne', sans-serif" }}>

      {/* ── Top bar ── */}
      <header className="border-b border-white/[0.06] px-6 py-4 flex items-center gap-4 bg-black/60 backdrop-blur-sm sticky top-0 z-50">
        <Link href="/" className="font-bebas text-[1.6rem] tracking-[3px] text-cream no-underline flex-shrink-0 hover:text-acid transition-colors" style={{ fontFamily: "'Bebas Neue', cursive" }}>
          Arena<span className="text-acid">X</span>
        </Link>
        <span className="text-white/10 hidden md:block">|</span>
        <h1 className="font-extrabold text-[1rem] hidden md:block">Contests</h1>

        <div className="flex items-center gap-2 ml-auto">
          {liveCnt > 0 && (
            <span className="flex items-center gap-1.5 font-mono text-[0.68rem] text-acid bg-acid/10 border border-acid/20 px-2.5 py-1 rounded-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-acid animate-ping" />
              {liveCnt} Live
            </span>
          )}
          <span className="font-mono text-[0.68rem] text-muted bg-white/[0.05] border border-white/[0.08] px-2.5 py-1 rounded-sm">
            {upcomingCnt} Upcoming
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 61px)" }}>

        {/* ── Left panel: list ── */}
        <div className="w-full md:w-[380px] lg:w-[420px] flex-shrink-0 flex flex-col border-r border-white/[0.06] overflow-hidden">

          {/* Filters */}
          <div className="px-4 pt-4 pb-3 border-b border-white/[0.06] space-y-3 bg-[#0d0d0f]">
            {/* Search */}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search contests…"
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded px-3 py-2 text-cream text-[0.85rem] outline-none focus:border-acid/40 placeholder:text-muted font-mono text-[0.78rem] transition-colors"
            />
            {/* Status tabs */}
            <div className="flex gap-1 flex-wrap">
              {STATUS_TABS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setStatusFilter(t.value)}
                  className={`font-mono text-[0.62rem] tracking-[1.5px] uppercase px-2.5 py-1 rounded-sm border transition-all duration-150 ${
                    statusFilter === t.value
                      ? "bg-acid text-black border-acid"
                      : "text-muted border-white/[0.08] hover:border-white/20 hover:text-cream"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {/* Category chips */}
            <div className="flex gap-1 flex-wrap">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`font-mono text-[0.6rem] tracking-[1px] uppercase px-2 py-0.5 rounded-sm border transition-all duration-150 ${
                    categoryFilter === cat
                      ? "bg-white/15 text-cream border-white/30"
                      : "text-muted border-white/[0.06] hover:border-white/15 hover:text-cream/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Contest list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-16 text-center font-mono text-[0.78rem] text-muted">No contests found</div>
            ) : (
              filtered.map(c => (
                <ContestRow
                  key={c.id}
                  contest={c}
                  selected={c.id === selectedId}
                  onClick={() => setSelectedId(c.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right panel: detail ── */}
        <div className="hidden md:flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <ContestDetailPanel
              contest={selected}
              onRegister={() => setRegisterContest(selected)}
            />
          </div>
        </div>
      </div>

      {/* Register Modal */}
      {registerContest && (
        <RegisterModal
          contest={registerContest}
          onClose={() => setRegisterContest(null)}
        />
      )}
    </div>
  );
}
