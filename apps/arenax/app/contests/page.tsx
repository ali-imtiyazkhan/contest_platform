"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare, User, Users as UsersIcon, Zap } from "lucide-react";
import ChatSidebar from "../../components/ChatSidebar";

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

interface ActivityItem {
  type: "join" | "submit" | "solve";
  userName: string;
  challengeTitle?: string;
  points?: number;
  timestamp: string;
}

function ActivityFeed({ contestId }: { contestId: string }) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchActivity = async () => {
      try {
        const res = await fetch(`${API_BASE}/contest/${contestId}/activity`);
        const json = await res.json();
        if (mounted && json.ok) {
          setActivities(json.data);
        }
      } catch (e) {
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 10000); // refresh every 10s
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [contestId]);

  if (loading) return <div className="px-6 py-4 font-mono text-[0.65rem] text-[var(--text-muted)]">Loading activity...</div>;
  if (activities.length === 0) return <div className="px-6 py-4 font-mono text-[0.65rem] text-[var(--text-muted)]">No recent activity</div>;

  return (
    <div className="px-6 py-4 space-y-3">
      <span className="font-mono text-[0.65rem] text-[var(--text-muted)] tracking-[2px] uppercase block mb-2">Recent Activity</span>
      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
        {activities.map((act, i) => (
          <div key={i} className="text-[0.72rem] leading-tight border-l-2 border-[var(--border-secondary)] pl-3 py-0.5">
            <span className="text-[var(--accent)] font-bold">{act.userName}</span>{" "}
            <span className="text-[var(--text-muted)]">
              {act.type === "join" && "joined the contest"}
              {act.type === "submit" && `submitted ${act.challengeTitle}`}
              {act.type === "solve" && (
                <>
                  solved <span className="text-[var(--text-primary)]">{act.challengeTitle}</span>{" "}
                  <span className="text-[var(--accent)]">(+{act.points} pts)</span>
                </>
              )}
            </span>
            <div className="font-mono text-[0.55rem] text-[var(--text-muted)] opacity-20 mt-0.5">
              {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { BACKEND_URL as API_BASE } from "@/config";

async function fetchContestDetails(contestId: string): Promise<Contest | null> {
  try {
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
    if (!json.ok || !json.data) return null;

    const c = json.data;
    const now = new Date();
    const start = new Date(c.startTime);
    const end = new Date(c.endTime);
    const status: ContestStatus =
      now >= start && now <= end ? "live" : now < start ? "upcoming" : "completed";

    const challenges = (c.contestToChallengeMapping || []).map((m: any) => ({
      id: m.challenge?.id || m.challengeId,
      title: m.challenge?.title || "Untitled Challenge",
      type: m.challenge?.type || "Unknown",
      maxPoints: m.challenge?.maxPoints || 0,
      duration: m.challenge?.duration || 0,
    }));

    let participantCount = 0;
    try {
      const countRes = await fetch(`${API_BASE}/contest/${contestId}/participants/count`);
      const countJson = await countRes.json();
      participantCount = countJson.ok ? countJson.count : 0;
    } catch (e) { }

    return {
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
      host: c.host || "100xContest Official",
      description: c.description || "No description available",
      tags: Array.isArray(c.tags) ? c.tags : [],
    };
  } catch (e) {
    return null;
  }
}

async function fetchContests(): Promise<Contest[]> {
  try {
    const res = await fetch(`${API_BASE}/contest/`);
    const json = await res.json();
    if (!json.ok || !json.data) return [];

    const now = new Date();
    return json.data.map((c: any) => {
      const start = new Date(c.startTime);
      const end = new Date(c.endTime);
      const status: ContestStatus =
        now >= start && now <= end ? "live" : now < start ? "upcoming" : "completed";
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
        host: c.host || "100xContest Official",
        description: c.description || "",
        tags: Array.isArray(c.tags) ? c.tags : [],
      };
    });
  } catch (e) {
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
    return await res.json();
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
  const days = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return { days, h, m, s, done: secs === 0 };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Compact inline countdown for the list row */
function InlineCountdown({ startTime }: { startTime: string }) {
  const { days, h, m, s, done } = useCountdown(startTime);
  if (done) return <span className="font-mono text-[0.62rem] text-[var(--accent)]">Starting...</span>;
  if (days > 0)
    return (
      <span className="font-mono text-[0.62rem] text-orange-400">
        {days}d {pad(h)}h left
      </span>
    );
  return (
    <span className="font-mono text-[0.62rem] text-orange-400 tabular-nums">
      {pad(h)}:{pad(m)}:{pad(s)} left
    </span>
  );
}

/** Large countdown banner shown in the detail panel */
function CountdownBanner({ startTime }: { startTime: string }) {
  const { days, h, m, s, done } = useCountdown(startTime);

  if (done) {
    return (
      <div className="mx-6 my-4 rounded border border-[var(--accent-border)] bg-[var(--accent-bg)] px-4 py-3 text-center">
        <span className="font-mono text-[0.7rem] tracking-[2px] uppercase text-[var(--accent)]">
          Starting now…
        </span>
      </div>
    );
  }

  const units =
    days > 0
      ? [
        { label: "Days", value: pad(days) },
        { label: "Hours", value: pad(h) },
        { label: "Mins", value: pad(m) },
        { label: "Secs", value: pad(s) },
      ]
      : [
        { label: "Hours", value: pad(h) },
        { label: "Mins", value: pad(m) },
        { label: "Secs", value: pad(s) },
      ];

  return (
    <div className="mx-6 my-4 rounded border border-orange-500/25 bg-orange-500/[0.06] px-4 py-4">
      <p className="font-mono text-[0.6rem] tracking-[2.5px] uppercase text-orange-400 mb-3 text-center">
        ◷ Contest Starts In
      </p>
      <div className="flex items-center justify-center gap-3">
        {units.map(({ label, value }, i) => (
          <div key={label} className="flex items-center gap-3">
            <div className="text-center">
              <div
                className="text-orange-300 font-extrabold tabular-nums leading-none"
                style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "2rem" }}
              >
                {value}
              </div>
              <div className="font-mono text-[0.55rem] tracking-[1.5px] uppercase text-[var(--text-muted)] mt-0.5">
                {label}
              </div>
            </div>
            {i < units.length - 1 && (
              <span
                className="text-orange-500/50 font-bold pb-3"
                style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "1.5rem" }}
              >
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ContestStatus }) {
  const map = {
    live: { label: "● Live Now", cls: "bg-[var(--accent-bg)] text-[var(--accent)] border-[var(--accent-border)]" },
    upcoming: { label: "◷ Upcoming", cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
    completed: { label: "✓ Completed", cls: "bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border-secondary)]" },
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
    <div className="h-full flex flex-col bg-[var(--bg-card)] border-l border-[var(--border-primary)] overflow-y-auto">
      {/* Header */}
      <div className="px-6 pt-6 pb-5 border-b border-[var(--border-primary)] sticky top-0 bg-[var(--bg-card)] z-10">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <StatusBadge status={contest.status} />
            <h2 className="text-[var(--text-primary)] font-extrabold text-xl mt-2 leading-tight">{contest.title}</h2>
            <p className="font-mono text-[0.68rem] text-[var(--text-muted)] mt-1">by {contest.host}</p>
          </div>
          <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
            <button
              onClick={() => (window as any).toggleChat?.()}
              className="p-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg hover:border-[var(--accent-border)] hover:text-[var(--accent)] transition-all"
              title="Open Chat"
            >
              <MessageSquare size={18} />
            </button>
            <div>
              <div className="text-[var(--accent)] font-extrabold text-2xl" style={{ fontFamily: "'Bebas Neue', cursive" }}>
                ${contest.prize.toLocaleString()}
              </div>
              <div className="font-mono text-[0.62rem] text-[var(--text-muted)] tracking-widest uppercase">Prize Pool</div>
            </div>
          </div>
        </div>
        <p className="text-[var(--text-muted)] text-[0.82rem] leading-[1.6]">{contest.description}</p>
        {contest.tags.length > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {contest.tags.map((t, i) => (
              <span key={i} className="font-mono text-[0.62rem] text-[var(--text-muted)] border border-[var(--border-secondary)] px-2 py-0.5 rounded-sm">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Countdown Banner (upcoming only) ── */}
      {contest.status === "upcoming" && <CountdownBanner startTime={contest.startTime} />}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-px bg-[var(--border-primary)] border-b border-[var(--border-primary)]">
        {[
          { label: "Participants", value: contest.participants.toLocaleString() },
          { label: "Total Points", value: totalPts.toLocaleString() },
          { label: "Difficulty", value: contest.difficulty },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[var(--bg-card)] px-4 py-3 text-center">
            <div className="font-mono text-[0.6rem] text-[var(--text-muted)] tracking-widest uppercase mb-1">{label}</div>
            <div className="text-[var(--text-primary)] font-bold text-sm">{value}</div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-4 border-b border-[var(--border-primary)]">
        <div className="flex justify-between font-mono text-[0.65rem] text-[var(--text-muted)] mb-2">
          <span>Spots filled</span>
          <span>{fillPct}% · {contest.maxParticipants.toLocaleString()} max</span>
        </div>
        <div className="h-1.5 bg-[var(--border-secondary)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--accent)] rounded-full transition-all duration-700" style={{ width: `${fillPct}%` }} />
        </div>
      </div>

      {/* Challenges */}
      <div className="px-6 py-5 border-b border-[var(--border-primary)]">
        <span className="font-mono text-[0.65rem] text-[var(--text-muted)] tracking-[2px] uppercase block mb-3">
          Challenges ({contest.challenges.length})
        </span>
        {contest.challenges.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-muted)] text-sm">No challenges added yet</div>
        ) : (
          <div className="space-y-2">
            {contest.challenges.map((ch, i) => (
              <div key={ch.id} className="flex items-center gap-3 p-3 rounded border border-[var(--border-secondary)] bg-[var(--bg-secondary)] opacity-50">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[0.65rem] font-bold flex-shrink-0 bg-[var(--border-secondary)] text-[var(--text-muted)]">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.82rem] font-semibold truncate text-[var(--text-primary)]">{ch.title}</p>
                  <p className="font-mono text-[0.65rem] text-[var(--text-muted)]">
                    {ch.type} · {Math.floor(ch.duration / 60)}min
                  </p>
                </div>
                <span className="font-mono text-[0.7rem] font-bold flex-shrink-0 text-[var(--text-muted)]">
                  +{ch.maxPoints}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Feed */}
      <ActivityFeed contestId={contest.id} />

      {/* CTA Button */}
      <div className="px-6 py-5 sticky bottom-0 bg-[var(--bg-card)] border-t border-[var(--border-primary)] mt-auto">
        {contest.status !== "completed" ? (
          <button
            onClick={onRegister}
            className="w-full bg-[var(--accent)] text-[var(--accent-text-on)] font-extrabold text-[0.85rem] tracking-[2px] uppercase py-4 rounded hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200"
          >
            {contest.status === "live" ? "Join Contest Now →" : "Register & Get Notified →"}
          </button>
        ) : (
          <div className="text-center font-mono text-[0.72rem] text-[var(--text-muted)] py-2">
            This contest has ended.{" "}
            <Link href={`/leaderboard?contestId=${contest.id}`} className="text-[var(--accent)] hover:underline">
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
        className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-6 shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[var(--text-primary)] font-extrabold text-xl mb-4">
          {contest.status === "live" ? "Join Contest" : "Register"}
        </h3>
        <p className="text-[var(--text-muted)] text-sm mb-2">{contest.title}</p>

        {/* Show countdown in modal too for upcoming */}
        {contest.status === "upcoming" && (
          <div className="mb-4">
            <CountdownBanner startTime={contest.startTime} />
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[var(--accent)] text-[var(--accent-text-on)] font-extrabold text-sm tracking-[2px] uppercase py-4 rounded hover:opacity-90 disabled:opacity-40 transition-all"
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
      className={`w-full text-left px-5 py-4 border-b border-[var(--border-secondary)] transition-all duration-200 ${selected ? "bg-[var(--accent-bg)] border-l-2 border-l-[var(--accent)]" : "hover:bg-[var(--bg-card)] border-l-2 border-l-transparent"
        }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-[0.9rem] truncate ${selected ? "text-[var(--text-primary)]" : "text-[var(--text-primary)] opacity-90"}`}>
            {contest.title}
          </p>
          <p className="font-mono text-[0.65rem] text-[var(--text-muted)] mt-0.5">{contest.category}</p>
        </div>
        <StatusBadge status={contest.status} />
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.65rem] text-[var(--text-muted)]">{contest.difficulty}</span>
          {/* ── Inline countdown for upcoming contests in the row ── */}
          {contest.status === "upcoming" && (
            <>
              <span className="text-[var(--text-muted)] opacity-20 text-[0.6rem]">·</span>
              <InlineCountdown startTime={contest.startTime} />
            </>
          )}
        </div>
        <span className="font-mono text-[0.72rem] text-[var(--accent)] font-bold">${contest.prize.toLocaleString()}</span>
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
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    (window as any).toggleChat = () => setIsChatOpen(prev => !prev);
    return () => { delete (window as any).toggleChat; };
  }, []);

  useEffect(() => {
    fetchContests().then((data) => {
      setContests(data);
      setLoading(false);
      if (data.length > 0) setSelectedId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedId) {
      setDetailsLoading(true);
      setSelectedContest(null);
      fetchContestDetails(selectedId).then((details) => {
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
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-[var(--accent)] text-xl font-mono">Loading contests...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col" style={{ fontFamily: "'Syne', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-[var(--border-primary)] px-6 py-4 flex items-center gap-4 bg-[var(--bg-primary)] opacity-60 backdrop-blur-sm sticky top-0 z-50">
        <Link
          href="/"
          className="font-bebas text-[1.6rem] tracking-[3px] text-[var(--text-primary)] no-underline flex-shrink-0 hover:text-[var(--accent)] transition-colors"
          style={{ fontFamily: "'Bebas Neue', cursive" }}
        >
          100x<span className="text-[var(--accent)]">Contest</span>
        </Link>
        <span className="text-[var(--border-secondary)] hidden md:block">|</span>
        <h1 className="font-extrabold text-[1rem] hidden md:block">Contests</h1>

        <div className="flex items-center gap-2 ml-auto">
          {liveCnt > 0 && (
            <span className="flex items-center gap-1.5 font-mono text-[0.68rem] text-[var(--accent)] bg-[var(--accent-bg)] border border-[var(--accent-border)] px-2.5 py-1 rounded-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-ping" />
              {liveCnt} Live
            </span>
          )}
          <span className="font-mono text-[0.68rem] text-[var(--text-muted)] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] px-2.5 py-1 rounded-sm mr-4">
            {upcomingCnt} Upcoming
          </span>

          <nav className="flex items-center gap-3 border-l border-[var(--border-secondary)] pl-6 ml-2">
            <Link href="/duels" className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-widest">
              <Zap size={16} /> <span className="hidden lg:inline">Duels</span>
            </Link>
            <Link href="/teams" className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-widest">
              <UsersIcon size={16} /> <span className="hidden lg:inline">Squads</span>
            </Link>
            <Link href="/profile" className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-widest">
              <User size={16} /> <span className="hidden lg:inline">Profile</span>
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 61px)" }}>
        {/* Left Panel */}
        <div className="w-full md:w-[380px] lg:w-[420px] flex-shrink-0 flex flex-col border-r border-[var(--border-primary)] overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-[var(--border-primary)] space-y-3 bg-[var(--bg-secondary)]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contests…"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded px-3 py-2 text-[var(--text-primary)] text-[0.78rem] outline-none focus:border-[var(--accent-border)] placeholder:text-[var(--text-muted)] font-mono transition-colors"
            />
            <div className="flex gap-1 flex-wrap">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setStatusFilter(t.value)}
                  className={`font-mono text-[0.62rem] tracking-[1.5px] uppercase px-2.5 py-1 rounded-sm border transition-all duration-150 ${statusFilter === t.value
                    ? "bg-[var(--accent)] text-[var(--accent-text-on)] border-[var(--accent)]"
                    : "text-[var(--text-muted)] border-[var(--border-secondary)] hover:border-[var(--border-primary)] hover:text-[var(--text-primary)]"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-16 text-center font-mono text-[0.78rem] text-[var(--text-muted)]">No contests found</div>
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
              <div className="text-[var(--accent)] font-mono">Loading details...</div>
            </div>
          ) : selectedContest ? (
            <div className="flex-1 overflow-y-auto">
              <ContestDetailPanel contest={selectedContest} onRegister={() => setRegisterContest(selectedContest)} />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
              {selectedId ? "Failed to load contest details" : "Select a contest to view details"}
            </div>
          )}
        </div>
      </div>

      {registerContest && <RegisterModal contest={registerContest} onClose={() => setRegisterContest(null)} />}

      {selectedId && (
        <ChatSidebar
          contestId={selectedId}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
}