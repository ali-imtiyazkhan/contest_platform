"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────
// Types matching your backend
// ─────────────────────────────────────────────
type ContestStatus = "live" | "upcoming" | "completed";
type ContestCategory = "MATH" | "WRITING" | "GENERAL_KNOWLEDGE" | "TECH" | "All";

interface Challenge {
  id: string;
  title: string;
  type: string;
  maxPoints: number;
  duration: number;
}

interface ActivityEvent {
  id: string;
  user: string;
  avatar: string;
  avatarColor: string;
  action: string;
  time: string;
  points?: number;
}

interface Contest {
  id: string;
  title: string;
  category: string;
  status: ContestStatus;
  participants: number;
  maxParticipants: number;
  prize: number;
  startTime: string;
  endTime: string;
  challenges: Challenge[];
  difficulty: string;
  host: string;
  description: string;
  tags: string[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

async function fetchContests(): Promise<Contest[]> {
  const [all, active, upcoming, finished] = await Promise.all([
    fetch(`${API_BASE}/contest/`).then(r => r.json()),
    fetch(`${API_BASE}/contest/active`).then(r => r.json()),
    fetch(`${API_BASE}/contest/upcoming`).then(r => r.json()),
    fetch(`${API_BASE}/contest/finished`).then(r => r.json()),
  ]);

  const contests: Contest[] = [];
  const now = new Date();

  all.data?.forEach((c: any) => {
    const start = new Date(c.startTime);
    const end = new Date(c.endTime);
    const status: ContestStatus =
      now >= start && now <= end ? "live"
        : now < start ? "upcoming"
          : "completed";

    contests.push({
      id: c.id,
      title: c.title,
      category: c.category || "GENERAL_KNOWLEDGE",
      status,
      participants: 0,
      maxParticipants: c.maxParticipants || 1000,
      prize: c.prize || 0,
      startTime: c.startTime,
      endTime: c.endTime,
      challenges: [],
      difficulty: c.difficulty || "Intermediate",
      host: c.host || "ArenaX Official",
      description: c.description || "",
      tags: c.tags || [],
    });
  });

  return contests;
}

async function fetchContestDetails(contestId: string): Promise<Contest | null> {
  try {
    const res = await fetch(`${API_BASE}/contest/${contestId}`);
    const json = await res.json();
    if (!json.ok) return null;

    const c = json.data;
    const now = new Date();
    const start = new Date(c.startTime);
    const end = new Date(c.endTime);
    const status: ContestStatus =
      now >= start && now <= end ? "live"
        : now < start ? "upcoming"
          : "completed";

    const challenges = c.contestToChallengeMapping?.map((m: any) => ({
      id: m.challenge.id,
      title: m.challenge.title,
      type: m.challenge.type,
      maxPoints: m.challenge.maxPoints,
      duration: m.challenge.duration,
    })) || [];

    return {
      id: c.id,
      title: c.title,
      category: c.category || "GENERAL_KNOWLEDGE",
      status,
      participants: 0,
      maxParticipants: c.maxParticipants || 1000,
      prize: c.prize || 0,
      startTime: c.startTime,
      endTime: c.endTime,
      challenges,
      difficulty: c.difficulty || "Intermediate",
      host: c.host || "ArenaX Official",
      description: c.description || "",
      tags: c.tags || [],
    };
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function registerForContest(contestId: string): Promise<{ ok: boolean; message?: string }> {
  try {
    const token = localStorage.getItem("token");
    console.log("token is : ", token)
    const res = await fetch(`${API_BASE}/contest/${contestId}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json();
    return json;
  } catch (e) {
    return { ok: false, message: "Network error" };
  }
}

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
    live: { label: "● Live Now", cls: "bg-acid/15 text-acid border-acid/30" },
    upcoming: { label: "◷ Upcoming", cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
    completed: { label: "✓ Completed", cls: "bg-white/10 text-muted border-white/15" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`font-mono text-[0.65rem] tracking-[2px] uppercase px-2.5 py-1 rounded-sm border ${cls}`}>
      {label}
    </span>
  );
}

function DifficultyPip({ level }: { level: string }) {
  const colors: Record<string, string> = {
    Beginner: "text-emerald-400", Intermediate: "text-amber-400",
    Advanced: "text-orange-400", Elite: "text-red-400",
  };
  return <span className={`font-mono text-[0.68rem] font-bold tracking-widest ${colors[level] || "text-muted"}`}>{level}</span>;
}

function ActivityFeed({ contest }: { contest: Contest }) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [pulse, setPulse] = useState(false);

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
      </div>
    </div>
  );
}

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
              className={`flex items-center gap-3 p-3 rounded border transition-colors duration-200 ${active ? "border-acid/40 bg-acid/[0.06]"
                : done ? "border-white/[0.06] bg-white/[0.03] opacity-60"
                  : "border-white/[0.04] bg-white/[0.02]"
                }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[0.65rem] font-bold flex-shrink-0 ${active ? "bg-acid text-black"
                : done ? "bg-white/20 text-white"
                  : "bg-white/[0.06] text-muted"
                }`}>
                {done ? "✓" : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[0.82rem] font-semibold truncate ${done ? "text-muted" : "text-cream"}`}>{ch.title}</p>
                <p className="font-mono text-[0.65rem] text-muted">{ch.type} · {Math.floor(ch.duration / 60)}min</p>
              </div>
              <span className={`font-mono text-[0.7rem] font-bold flex-shrink-0 ${active ? "text-acid" : "text-muted"}`}>
                +{ch.maxPoints}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

function RegisterModal({ contest, onClose }: { contest: Contest; onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "success">("form");
  const [form, setForm] = useState({ name: "", email: "", handle: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { h, m, s } = useCountdown(contest.startTime);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.handle) return;
    setLoading(true);
    setError("");

    const result = await registerForContest(contest.id);

    setLoading(false);
    if (result.ok) {
      setStep("success");
    } else {
      setError(result.message || "Registration failed");
    }
  };

  const handleEnterArena = () => {
    router.push(`/contests/${contest.id}/challenges/${contest.challenges[0]?.id}`);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-[#111113] border border-white/[0.12] rounded-xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-acid/[0.06] border-b border-acid/[0.12] px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[0.65rem] text-acid tracking-[2px] uppercase mb-1">Register for Contest</p>
            <h3 className="text-cream font-extrabold text-lg leading-tight">{contest.title}</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-cream transition-colors text-xl leading-none">✕</button>
        </div>

        {step === "form" ? (
          <>
            <div className="px-6 pt-5 pb-4 grid grid-cols-3 gap-3 border-b border-white/[0.06]">
              {[
                { label: "Prize Pool", value: `$${contest.prize.toLocaleString()}` },
                { label: "Difficulty", value: contest.difficulty },
                { label: "Participants", value: `${contest.participants.toLocaleString()}` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/[0.04] rounded p-3 text-center">
                  <div className="font-mono text-[0.6rem] text-muted tracking-widest uppercase mb-1">{label}</div>
                  <div className="text-cream font-bold text-[0.9rem]">{value}</div>
                </div>
              ))}
            </div>

            {contest.status === "upcoming" && (
              <div className="px-6 pt-5">
                <CountdownBlock targetIso={contest.startTime} label="Starts in" />
              </div>
            )}

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

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

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
                onClick={handleEnterArena}
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

function ContestDetailPanel({ contest, onRegister }: { contest: Contest; onRegister: () => void }) {
  const fillPct = Math.round((contest.participants / contest.maxParticipants) * 100);
  const totalPts = contest.challenges.reduce((a, c) => a + c.maxPoints, 0);

  return (
    <div className="h-full flex flex-col bg-[#111113] border-l border-white/[0.06] overflow-y-auto">
      <div className="px-6 pt-6 pb-5 border-b border-white/[0.06] sticky top-0 bg-[#111113] z-10">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <StatusBadge status={contest.status} />
            <h2 className="text-cream font-extrabold text-xl mt-2 leading-tight">{contest.title}</h2>
            <p className="font-mono text-[0.68rem] text-muted mt-1">by {contest.host}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-acid font-extrabold text-2xl" style={{ fontFamily: "'Bebas Neue', cursive" }}>${contest.prize.toLocaleString()}</div>
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

      <div className="px-6 py-4 border-b border-white/[0.06]">
        <div className="flex justify-between font-mono text-[0.65rem] text-muted mb-2">
          <span>Spots filled</span>
          <span>{fillPct}% · {contest.maxParticipants.toLocaleString()} max</span>
        </div>
        <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
          <div className="h-full bg-acid rounded-full transition-all duration-700" style={{ width: `${fillPct}%` }} />
        </div>
      </div>

      <div className="px-6 py-5 border-b border-white/[0.06]">
        {contest.status === "upcoming" && <CountdownBlock targetIso={contest.startTime} label="Starts in" />}
        {contest.status === "live" && <CountdownBlock targetIso={contest.endTime} label="Time remaining" />}
        {contest.status === "completed" && (
          <div className="font-mono text-[0.72rem] text-muted">Contest ended · Results finalised</div>
        )}
      </div>

      <div className="px-6 py-5 border-b border-white/[0.06]">
        <ChallengeTimeline contest={contest} />
      </div>

      <div className="px-6 py-5 flex-1 min-h-[260px] border-b border-white/[0.06]">
        <ActivityFeed contest={contest} />
      </div>

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
            This contest has ended. <Link href={`/leaderboard?contestId=${contest.id}`} className="text-acid hover:underline">View results →</Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ContestRow({ contest, selected, onClick }: { contest: Contest; selected: boolean; onClick: () => void }) {
  const fillPct = Math.round((contest.participants / contest.maxParticipants) * 100);
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-4 border-b border-white/[0.05] transition-all duration-200 group ${selected ? "bg-acid/[0.07] border-l-2 border-l-acid" : "hover:bg-white/[0.03] border-l-2 border-l-transparent"
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
        <span className="font-mono text-[0.72rem] text-acid font-bold">${contest.prize.toLocaleString()}</span>
      </div>
      <div className="h-0.5 bg-white/[0.06] rounded-full mt-3 overflow-hidden">
        <div className="h-full bg-acid/50 rounded-full" style={{ width: `${fillPct}%` }} />
      </div>
    </button>
  );
}

const STATUS_TABS: { label: string; value: ContestStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "🔴 Live", value: "live" },
  { label: "◷ Upcoming", value: "upcoming" },
  { label: "✓ Completed", value: "completed" },
];

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ContestStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [registerContest, setRegisterContest] = useState<Contest | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchContests().then(data => {
      setContests(data);
      setLoading(false);
      if (data.length > 0) {
        setSelectedId(data[0].id);
        fetchContestDetails(data[0].id).then(setSelectedContest);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchContestDetails(selectedId).then(setSelectedContest);
    }
  }, [selectedId]);

  const filtered = contests.filter(c => {
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const liveCnt = contests.filter(c => c.status === "live").length;
  const upcomingCnt = contests.filter(c => c.status === "upcoming").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-acid text-xl font-mono">Loading contests...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-cream flex flex-col" style={{ fontFamily: "'Syne', sans-serif" }}>
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
        <div className="w-full md:w-[380px] lg:w-[420px] flex-shrink-0 flex flex-col border-r border-white/[0.06] overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-white/[0.06] space-y-3 bg-[#0d0d0f]">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search contests…"
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded px-3 py-2 text-cream text-[0.78rem] outline-none focus:border-acid/40 placeholder:text-muted font-mono transition-colors"
            />
            <div className="flex gap-1 flex-wrap">
              {STATUS_TABS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setStatusFilter(t.value)}
                  className={`font-mono text-[0.62rem] tracking-[1.5px] uppercase px-2.5 py-1 rounded-sm border transition-all duration-150 ${statusFilter === t.value
                    ? "bg-acid text-black border-acid"
                    : "text-muted border-white/[0.08] hover:border-white/20 hover:text-cream"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

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

        <div className="hidden md:flex flex-1 overflow-hidden">
          {selectedContest ? (
            <div className="flex-1 overflow-y-auto">
              <ContestDetailPanel
                contest={selectedContest}
                onRegister={() => setRegisterContest(selectedContest)}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted">
              Select a contest to view details
            </div>
          )}
        </div>
      </div>

      {registerContest && (
        <RegisterModal
          contest={registerContest}
          onClose={() => setRegisterContest(null)}
        />
      )}
    </div>
  );
}