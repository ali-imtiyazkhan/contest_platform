"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ContestStatus = "live" | "upcoming" | "completed";

interface Challenge {
  id: string;
  title: string;
  type: string;
  maxPoints: number;
  duration: number;
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

async function fetchContestDetails(contestId: string): Promise<Contest | null> {
  try {
    console.log("Fetching contest:", contestId);

    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/contest/${contestId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });
    const json = await res.json();

    console.log("API Response:", json);

    if (!json.ok || !json.data) {
      console.error("Invalid response structure");
      return null;
    }

    const c = json.data;
    const now = new Date();
    const start = new Date(c.startTime);
    const end = new Date(c.endTime);
    const status: ContestStatus =
      now >= start && now <= end ? "live"
        : now < start ? "upcoming"
          : "completed";


    const challenges = (c.contestToChallengeMapping || []).map((m: any) => ({
      id: m.challenge?.id || m.challengeId,
      title: m.challenge?.title || "Untitled Challenge",
      type: m.challenge?.type || "Unknown",
      maxPoints: m.challenge?.maxPoints || 0,
      duration: m.challenge?.duration || 0,
    }));

    console.log("Mapped challenges:", challenges);


    let participantCount = 0;
    try {
      const countRes = await fetch(`${API_BASE}/contest/${contestId}/participants/count`);
      const countJson = await countRes.json();
      participantCount = countJson.ok ? countJson.count : 0;
    } catch (e) {
      console.warn("Could not fetch participant count");
    }

    const contestDetails: Contest = {
      id: c.id,
      title: c.title || "Untitled Contest",
      category: c.category || "GENERAL_KNOWLEDGE",
      status,
      participants: participantCount,
      maxParticipants: c.maxParticipants || 1000,
      prize: c.prize || 0,
      startTime: c.startTime,
      endTime: c.endTime,
      challenges,
      difficulty: c.difficulty || "Intermediate",
      host: c.host || "ArenaX Official",
      description: c.description || "No description available",
      tags: Array.isArray(c.tags) ? c.tags : [],
    };

    console.log("Returning contest details:", contestDetails);
    return contestDetails;

  } catch (e) {
    console.error("Error in fetchContestDetails:", e);
    return null;
  }
}

async function fetchContests(): Promise<Contest[]> {
  try {
    const res = await fetch(`${API_BASE}/contest/`);
    const json = await res.json();

    if (!json.ok || !json.data) return [];

    const now = new Date();
    const contests: Contest[] = json.data.map((c: any) => {
      const start = new Date(c.startTime);
      const end = new Date(c.endTime);
      const status: ContestStatus =
        now >= start && now <= end ? "live"
          : now < start ? "upcoming"
            : "completed";

      return {
        id: c.id,
        title: c.title || "Untitled Contest",
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
        tags: Array.isArray(c.tags) ? c.tags : [],
      };
    });

    return contests;
  } catch (e) {
    console.error("Error fetching contests:", e);
    return [];
  }
}

async function registerForContest(contestId: string): Promise<{ ok: boolean; message?: string }> {
  try {
    const token = localStorage.getItem("token");
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
  }, [targetIso]);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return { h, m, s, done: secs === 0 };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

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

function ContestDetailPanel({ contest, onRegister }: { contest: Contest; onRegister: () => void }) {
  const fillPct = Math.round((contest.participants / contest.maxParticipants) * 100);
  const totalPts = contest.challenges.reduce((a, c) => a + c.maxPoints, 0);

  return (
    <div className="h-full flex flex-col bg-[#111113] border-l border-white/[0.06] overflow-y-auto">
      {/* Header */}
      <div className="px-6 pt-6 pb-5 border-b border-white/[0.06] sticky top-0 bg-[#111113] z-10">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <StatusBadge status={contest.status} />
            <h2 className="text-cream font-extrabold text-xl mt-2 leading-tight">{contest.title}</h2>
            <p className="font-mono text-[0.68rem] text-muted mt-1">by {contest.host}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-acid font-extrabold text-2xl" style={{ fontFamily: "'Bebas Neue', cursive" }}>
              ${contest.prize.toLocaleString()}
            </div>
            <div className="font-mono text-[0.62rem] text-muted tracking-widest uppercase">Prize Pool</div>
          </div>
        </div>
        <p className="text-muted text-[0.82rem] leading-[1.6]">{contest.description}</p>
        {contest.tags.length > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {contest.tags.map((t, i) => (
              <span key={i} className="font-mono text-[0.62rem] text-muted border border-white/[0.08] px-2 py-0.5 rounded-sm">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats Grid */}
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

      {/* Progress Bar */}
      <div className="px-6 py-4 border-b border-white/[0.06]">
        <div className="flex justify-between font-mono text-[0.65rem] text-muted mb-2">
          <span>Spots filled</span>
          <span>{fillPct}% · {contest.maxParticipants.toLocaleString()} max</span>
        </div>
        <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
          <div className="h-full bg-acid rounded-full transition-all duration-700" style={{ width: `${fillPct}%` }} />
        </div>
      </div>

      {/* Challenges */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <span className="font-mono text-[0.65rem] text-muted tracking-[2px] uppercase block mb-3">
          Challenges ({contest.challenges.length})
        </span>
        {contest.challenges.length === 0 ? (
          <div className="text-center py-8 text-muted text-sm">No challenges added yet</div>
        ) : (
          <div className="space-y-2">
            {contest.challenges.map((ch, i) => (
              <div
                key={ch.id}
                className="flex items-center gap-3 p-3 rounded border border-white/[0.04] bg-white/[0.02]"
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[0.65rem] font-bold flex-shrink-0 bg-white/[0.06] text-muted">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.82rem] font-semibold truncate text-cream">{ch.title}</p>
                  <p className="font-mono text-[0.65rem] text-muted">
                    {ch.type} · {Math.floor(ch.duration / 60)}min
                  </p>
                </div>
                <span className="font-mono text-[0.7rem] font-bold flex-shrink-0 text-muted">
                  +{ch.maxPoints}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA Button */}
      <div className="px-6 py-5 sticky bottom-0 bg-[#111113] border-t border-white/[0.06] mt-auto">
        {contest.status !== "completed" ? (
          <button
            onClick={onRegister}
            className="w-full bg-acid text-black font-extrabold text-[0.85rem] tracking-[2px] uppercase py-4 rounded hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200 shadow-[0_8px_24px_rgba(200,241,53,0.25)]"
          >
            {contest.status === "live" ? "Join Contest Now →" : "Register & Get Notified →"}
          </button>
        ) : (
          <div className="text-center font-mono text-[0.72rem] text-muted py-2">
            This contest has ended.{" "}
            <Link href={`/leaderboard?contestId=${contest.id}`} className="text-acid hover:underline">
              View results →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function RegisterModal({ contest, onClose }: { contest: Contest; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const result = await registerForContest(contest.id);

    setLoading(false);
    if (result.ok) {

      if (contest.status === "live" && contest.challenges.length > 0) {
        router.push(`/contests/${contest.id}/challenge1/${contest.challenges[0].id}`);
      } else {
        onClose();
      }
    } else {
      setError(result.message || "Registration failed");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-[#111113] border border-white/[0.12] rounded-xl p-6 shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-cream font-extrabold text-xl mb-4">
          {contest.status === "live" ? "Join Contest" : "Register"}
        </h3>
        <p className="text-muted text-sm mb-6">{contest.title}</p>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-acid text-black font-extrabold text-sm tracking-[2px] uppercase py-4 rounded hover:opacity-90 disabled:opacity-40 transition-all"
        >
          {loading ? "Processing..." : contest.status === "live" ? "Join Now →" : "Register →"}
        </button>
      </div>
    </div>
  );
}

function ContestRow({ contest, selected, onClick }: { contest: Contest; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-4 border-b border-white/[0.05] transition-all duration-200 ${selected ? "bg-acid/[0.07] border-l-2 border-l-acid" : "hover:bg-white/[0.03] border-l-2 border-l-transparent"
        }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-[0.9rem] truncate ${selected ? "text-cream" : "text-cream/90"}`}>
            {contest.title}
          </p>
          <p className="font-mono text-[0.65rem] text-muted mt-0.5">{contest.category}</p>
        </div>
        <StatusBadge status={contest.status} />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="font-mono text-[0.65rem] text-muted">{contest.difficulty}</span>
        <span className="font-mono text-[0.72rem] text-acid font-bold">${contest.prize.toLocaleString()}</span>
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
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchContests().then((data) => {
      console.log("Fetched contests:", data);
      setContests(data);
      setLoading(false);
      if (data.length > 0) {
        setSelectedId(data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedId) {
      console.log("Selected contest ID changed:", selectedId);
      setDetailsLoading(true);
      setSelectedContest(null);

      fetchContestDetails(selectedId).then((details) => {
        console.log("Fetched details:", details);
        setSelectedContest(details);
        setDetailsLoading(false);
      });
    }
  }, [selectedId]);

  const filtered = contests.filter((c) => {
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const liveCnt = contests.filter((c) => c.status === "live").length;
  const upcomingCnt = contests.filter((c) => c.status === "upcoming").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-acid text-xl font-mono">Loading contests...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-cream flex flex-col" style={{ fontFamily: "'Syne', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-white/[0.06] px-6 py-4 flex items-center gap-4 bg-black/60 backdrop-blur-sm sticky top-0 z-50">
        <Link
          href="/"
          className="font-bebas text-[1.6rem] tracking-[3px] text-cream no-underline flex-shrink-0 hover:text-acid transition-colors"
          style={{ fontFamily: "'Bebas Neue', cursive" }}
        >
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
        {/* Left Panel */}
        <div className="w-full md:w-[380px] lg:w-[420px] flex-shrink-0 flex flex-col border-r border-white/[0.06] overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-white/[0.06] space-y-3 bg-[#0d0d0f]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contests…"
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded px-3 py-2 text-cream text-[0.78rem] outline-none focus:border-acid/40 placeholder:text-muted font-mono transition-colors"
            />
            <div className="flex gap-1 flex-wrap">
              {STATUS_TABS.map((t) => (
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
              filtered.map((c) => (
                <ContestRow key={c.id} contest={c} selected={c.id === selectedId} onClick={() => setSelectedId(c.id)} />
              ))
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="hidden md:flex flex-1 overflow-hidden">
          {detailsLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-acid font-mono">Loading details...</div>
            </div>
          ) : selectedContest ? (
            <div className="flex-1 overflow-y-auto">
              <ContestDetailPanel contest={selectedContest} onRegister={() => setRegisterContest(selectedContest)} />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted">
              {selectedId ? "Failed to load contest details" : "Select a contest to view details"}
            </div>
          )}
        </div>
      </div>

      {registerContest && <RegisterModal contest={registerContest} onClose={() => setRegisterContest(null)} />}
    </div>
  );
}