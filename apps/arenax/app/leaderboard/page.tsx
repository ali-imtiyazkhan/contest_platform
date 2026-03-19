"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";

// Types mirror the backend response exactly
interface Contest {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Elite";
  prize: number;
  category: string;
  host?: string | null;
  tags: string[];
}

type Verdict = "full" | "partial" | "zero" | "judging" | "unattempted";

interface ChallengeScore {
  challengeId: string;
  title: string;
  maxPoints: number;
  awarded: number;
  status: "Pending" | "Judging" | "Accepted" | "Rejected" | null;
  verdict: Verdict;
  submittedAt: string | null;
  updatedAt: string | null;
}

interface LeaderboardRow {
  rank: number;
  userId: string;
  email: string;
  displayName: string | null;
  country: string | null;
  avatarColor: string;
  rating: number;
  totalScore: number;
  maxPossible: number;
  scorePct: number;
  challengeScores: ChallengeScore[];
  firstSolveAt: string | null;
  lastActivityAt: string | null;
}

interface ChallengeInfo {
  id: string;
  title: string;
  maxPoints: number;
  index: number;
}

interface RecentSolve {
  userId: string;
  email: string;
  displayName: string | null;
  avatarColor: string;
  challengeTitle: string;
  points: number;
  solvedAt: string;
}

interface LeaderboardStats {
  totalParticipants: number;
  avgScorePct: number;
  topScore: number;
  maxPossible: number;
  fullSolveCount: number;
}

interface LeaderboardResponse {
  ok: boolean;
  challenges: ChallengeInfo[];
  leaderboard: LeaderboardRow[];
  recentSolves: RecentSolve[];
  stats: LeaderboardStats;
}

interface ToastItem {
  id: string;
  displayName: string | null;
  email: string;
  avatarColor: string;
  challengeTitle: string;
  points: number;
}


// Constants
import { BACKEND_URL as API_BASE } from "@/config";
const POLL_INTERVAL_MS = 8000;

const VERDICT_COLORS: Record<Verdict, string> = {
  full: "#c8f135",
  partial: "#f5a623",
  zero: "#ef4444",
  judging: "#60a5fa",
  unattempted: "transparent",
};

const VERDICT_LABELS: Record<Verdict, string> = {
  full: "Full marks",
  partial: "Partial credit",
  zero: "No marks",
  judging: "Judging...",
  unattempted: "Not attempted",
};

const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner: "#34d399",
  Intermediate: "#f5a623",
  Advanced: "#f43f5e",
  Elite: "#a855f7",
};

// API helpers
async function apiFetchContests(): Promise<Contest[]> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${API_BASE}/contest`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });
  const json = await res.json();
  return json.ok ? json.data : [];
}

async function apiFetchLeaderboard(contestId: string): Promise<LeaderboardResponse> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${API_BASE}/contest/${contestId}/leaderboard?limit=50`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });
  return res.json();
}

function contestStatus(c: Contest): "live" | "upcoming" | "finished" {
  const now = Date.now();
  const start = new Date(c.startTime).getTime();
  const end = new Date(c.endTime).getTime();
  if (now < start) return "upcoming";
  if (now > end) return "finished";
  return "live";
}

function displayHandle(row: LeaderboardRow): string {
  return row.displayName ?? row.email.split("@")[0];
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

// Sub-components

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl select-none">🥇</span>;
  if (rank === 2) return <span className="text-xl select-none">🥈</span>;
  if (rank === 3) return <span className="text-xl select-none">🥉</span>;
  return (
    <span className="font-mono text-[0.72rem] text-[var(--text-muted)] w-6 text-center inline-block tabular-nums font-bold">
      {rank}
    </span>
  );
}

function Avatar({ row, size = 32 }: { row: LeaderboardRow; size?: number }) {
  const letter = (row.displayName ?? row.email)[0].toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-black flex-shrink-0 select-none shadow-sm"
      style={{ width: size, height: size, background: row.avatarColor, fontSize: size * 0.34 }}
    >
      {letter}
    </div>
  );
}

function ScoreBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-[4px] bg-[var(--bg-card)] rounded-full overflow-hidden w-full">
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }}
      />
    </div>
  );
}

function VerdictPip({ cs }: { cs: ChallengeScore }) {
  const color = VERDICT_COLORS[cs.verdict];
  const isPending = cs.verdict === "judging";
  const isUnattempted = cs.verdict === "unattempted";

  return (
    <div className="group relative">
      <div
        className={`w-3.5 h-3.5 rounded-sm cursor-default border ${isPending ? "animate-pulse" : ""}`}
        style={{
          background: isUnattempted ? "transparent" : color,
          borderColor: isUnattempted ? "var(--border-secondary)" : color,
          opacity: isUnattempted ? 0.3 : 1,
        }}
      />
      {/* Tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md px-3 py-2 shadow-2xl whitespace-nowrap text-left min-w-[160px]">
          <p className="text-[var(--text-primary)] text-[0.73rem] font-semibold mb-0.5">{cs.title}</p>
          <p className="text-[0.63rem] mb-1" style={{ color: isUnattempted ? "var(--text-muted)" : color }}>
            {VERDICT_LABELS[cs.verdict]}
          </p>
          {cs.verdict !== "unattempted" && cs.verdict !== "judging" && (
            <p className="font-mono text-[0.63rem] text-[var(--accent)] font-bold">
              {cs.awarded} / {cs.maxPoints} pts
            </p>
          )}
          {cs.submittedAt && (
            <p className="font-mono text-[0.58rem] text-[var(--text-muted)] mt-0.5">
              {relativeTime(cs.submittedAt)}
            </p>
          )}
        </div>
        <div className="w-2 h-2 bg-[var(--bg-secondary)] border-r border-b border-[var(--border-primary)] rotate-45 mx-auto -mt-1" />
      </div>
    </div>
  );
}

// Expanded per-challenge breakdown panel
function ExpandedPanel({ row }: { row: LeaderboardRow }) {
  return (
    <tr>
      <td colSpan={7} className="px-4 pb-5 pt-1">
        <div className="ml-12 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-inner animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="font-mono text-[0.6rem] text-[var(--text-muted)] tracking-[3px] uppercase mb-4 opacity-60 font-black">
            Challenge breakdown
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {row.challengeScores.map((cs) => {
              const color = VERDICT_COLORS[cs.verdict];
              const pct =
                cs.maxPoints > 0 ? Math.round((cs.awarded / cs.maxPoints) * 100) : 0;
              return (
                <div
                  key={cs.challengeId}
                  className="bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-2xl p-4 hover:border-[var(--accent-border)] transition-colors shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[var(--text-primary)] text-[0.8rem] font-black truncate pr-2">
                      {cs.title}
                    </span>
                    <span
                      className="font-mono text-[0.67rem] font-black flex-shrink-0"
                      style={{ color: cs.verdict === "unattempted" || cs.verdict === "judging" ? "var(--text-muted)" : color }}
                    >
                      {cs.verdict === "unattempted" || cs.verdict === "judging"
                        ? "—"
                        : `${cs.awarded}/${cs.maxPoints}`}
                    </span>
                  </div>
                  <ScoreBar
                    pct={cs.verdict === "unattempted" || cs.verdict === "judging" ? 0 : pct}
                    color={color}
                  />
                  <div className="flex items-center justify-between mt-2.5">
                    <span
                      className="font-mono text-[0.6rem] font-black uppercase tracking-widest"
                      style={{ color: cs.verdict === "unattempted" ? "var(--text-muted)" : color }}
                    >
                      {VERDICT_LABELS[cs.verdict]}
                    </span>
                    {cs.submittedAt && (
                      <span className="font-mono text-[0.6rem] text-[var(--text-muted)] font-bold">
                        {relativeTime(cs.submittedAt)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Extra info row */}
          <div className="flex items-center gap-10 mt-6 pt-6 border-t border-[var(--border-primary)] flex-wrap">
            <div className="flex flex-col">
              <p className="font-mono text-[0.6rem] text-[var(--text-muted)] tracking-widest uppercase mb-1 font-black opacity-50">Rating</p>
              <p className="font-mono text-[0.9rem] text-[var(--accent)] font-black">{row.rating}</p>
            </div>
            {row.firstSolveAt && (
              <div className="flex flex-col">
                <p className="font-mono text-[0.6rem] text-[var(--text-muted)] tracking-widest uppercase mb-1 font-black opacity-50">First solve</p>
                <p className="font-mono text-[0.9rem] text-[var(--text-primary)] font-black">{relativeTime(row.firstSolveAt)}</p>
              </div>
            )}
            {row.lastActivityAt && (
              <div className="flex flex-col">
                <p className="font-mono text-[0.6rem] text-[var(--text-muted)] tracking-widest uppercase mb-1 font-black opacity-50">Last activity</p>
                <p className="font-mono text-[0.9rem] text-[var(--text-primary)] font-black">{relativeTime(row.lastActivityAt)}</p>
              </div>
            )}
            {row.country && (
              <div className="flex flex-col">
                <p className="font-mono text-[0.6rem] text-[var(--text-muted)] tracking-widest uppercase mb-1 font-black opacity-50">Country</p>
                <p className="font-mono text-[0.9rem] text-[var(--text-primary)] font-black">{row.country}</p>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-2xl px-6 py-5 shadow-sm hover:shadow-lg transition-all hover:translate-y-[-2px]">
      <p className="font-mono text-[0.6rem] text-[var(--text-muted)] tracking-[3px] uppercase mb-2 font-black opacity-50">{label}</p>
      <p
        className="font-extrabold text-3xl leading-none"
        style={{ fontFamily: "var(--font-bebas)", color: accent ?? "var(--text-primary)" }}
      >
        {value}
      </p>
      {sub && <p className="font-mono text-[0.65rem] text-[var(--text-muted)] mt-2 italic font-bold opacity-60">{sub}</p>}
    </div>
  );
}

function ScoreDistribution({ rows, maxPossible }: { rows: LeaderboardRow[]; maxPossible: number }) {
  const buckets = [0, 0, 0, 0, 0];
  rows.forEach((r) => {
    const pct = maxPossible > 0 ? Math.round((r.totalScore / maxPossible) * 100) : 0;
    buckets[Math.min(4, Math.floor(pct / 20))]++;
  });
  const maxB = Math.max(...buckets, 1);
  const labels = ["0–20", "20–40", "40–60", "60–80", "80–100"];
  const colors = ["#ef4444", "#f97316", "#f5a623", "#a3e635", "var(--accent)"];
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-3xl p-6 shadow-sm">
      <p className="font-mono text-[0.6rem] text-[var(--text-muted)] tracking-[3px] uppercase mb-6 font-black opacity-50">Score distribution %</p>
      <div className="flex items-end gap-3 h-28">
        {buckets.map((count, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <span className="font-mono text-[0.7rem] font-black text-[var(--text-primary)]">{count}</span>
            <div
              className="w-full rounded-t-xl transition-all duration-1000 ease-in-out"
              style={{
                height: `${(count / maxB) * 80}px`,
                background: colors[i],
                minHeight: count > 0 ? "6px" : "1px",
              }}
            />
            <span className="font-mono text-[0.55rem] text-[var(--text-muted)] font-black tracking-widest rotate-[-45deg] mt-3 origin-center sm:rotate-0 sm:mt-2">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}



// Live solve toast 
function SolveToast({ item, onExpire }: { item: ToastItem; onExpire: () => void }) {
  useEffect(() => {
    const t = setTimeout(onExpire, 5000);
    return () => clearTimeout(t);
  }, [onExpire]);

  const handle = item.displayName ?? item.email.split("@")[0];

  return (
    <div
      className="w-[340px] flex items-stretch gap-0 bg-[var(--bg-secondary)] border border-[var(--accent-border)] rounded-2xl overflow-hidden shadow-2xl"
      style={{ animation: "toastIn 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}
    >
      <div className="w-2 bg-[var(--accent)] flex-shrink-0" />
      <div className="flex items-start gap-4 p-4 flex-1">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-[0.9rem] font-black text-black flex-shrink-0 shadow-xl border-2 border-white/10"
          style={{ background: item.avatarColor }}
        >
          {(item.displayName ?? item.email)[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[0.65rem] text-[var(--accent)] tracking-[3px] uppercase mb-1 font-black">
            🔥 CHALLENGE SOLVED
          </p>
          <p className="text-[var(--text-primary)] font-black text-[1rem] truncate leading-tight tracking-tight">@{handle}</p>
          <p className="font-mono text-[0.7rem] text-[var(--text-muted)] truncate mt-1.5 font-bold opacity-80">{item.challengeTitle}</p>
          <p className="font-mono text-[0.75rem] text-[var(--accent)] font-black mt-1 tracking-wider">+{item.points} PTS</p>
        </div>
      </div>
    </div>
  );
}


// Contest selector 
function ContestPill({
  contest,
  active,
  onClick,
}: {
  contest: Contest;
  active: boolean;
  onClick: () => void;
}) {
  const status = contestStatus(contest);
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 px-5 py-3 rounded-2xl border text-left transition-all duration-300 ${active
        ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-text-on)] shadow-xl shadow-[var(--accent-bg)]"
        : "bg-[var(--bg-card)] border-[var(--border-secondary)] text-[var(--text-muted)] hover:border-[var(--accent-border)] hover:text-[var(--text-primary)] hover:translate-y-[-2px] hover:shadow-md"
        }`}
    >
      {status === "live" && (
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${active ? "bg-[var(--accent-text-on)]" : "bg-[var(--accent)]"} animate-ping`} />
      )}
      <span className="font-mono text-[0.68rem] tracking-[2.5px] uppercase truncate max-w-[200px] font-black">
        {contest.title}
      </span>
    </button>
  );
}


// Main page content
function LeaderboardContent() {
  const searchParams = useSearchParams();

  const [contests, setContests] = useState<Contest[]>([]);
  const [contestId, setContestId] = useState(searchParams.get("contestId") ?? "");
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [sortBy, setSortBy] = useState<"score" | "firstSolve">("score");

  const seenSolves = useRef(new Set<string>());

  const contest = contests.find((c) => c.id === contestId);
  const status = contest ? contestStatus(contest) : null;

  // Load contest list once
  useEffect(() => {
    apiFetchContests()
      .then((list) => {
        setContests(list);
        if (!contestId && list.length > 0) setContestId(list[0].id);
      })
      .catch(() => setError("Failed to load contests"));
  }, []);

  // Load leaderboard
  const load = useCallback(
    async (bg = false) => {
      if (!contestId) return;
      try {
        if (!bg) setLoading(true);
        const res = await apiFetchLeaderboard(contestId);
        if (!res.ok) throw new Error();
        setData(res);
        setLastUpdate(new Date());
        setError(null);

        // Fire toasts for any new solve
        for (const solve of res.recentSolves) {
          const key = `${solve.userId}:${solve.challengeTitle}:${solve.solvedAt.slice(0, 16)}`;
          if (!seenSolves.current.has(key)) {
            seenSolves.current.add(key);
            setToasts((prev) => [
              ...prev.slice(-3), // max 4 toasts
              {
                id: key,
                displayName: solve.displayName,
                email: solve.email,
                avatarColor: solve.avatarColor,
                challengeTitle: solve.challengeTitle,
                points: solve.points,
              },
            ]);
          }
        }
      } catch {
        setError("Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    },
    [contestId],
  );

  useEffect(() => {
    setExpandedUserId(null);
    seenSolves.current.clear();
    load(false);
  }, [load]);

  // Poll every 8 s during live contests
  useEffect(() => {
    if (status !== "live") return;
    const id = setInterval(() => load(true), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [status, load]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sort
  const rows = data
    ? [...data.leaderboard].sort((a, b) => {
      if (sortBy === "firstSolve") {
        if (!a.firstSolveAt) return 1;
        if (!b.firstSolveAt) return -1;
        return new Date(a.firstSolveAt).getTime() - new Date(b.firstSolveAt).getTime();
      }
      return a.rank - b.rank;
    })
    : [];

  const diffColor = contest ? (DIFFICULTY_COLOR[contest.difficulty] ?? "#888") : "#888";

  return (
    <div
      className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-700 selection:bg-[var(--accent)] selection:text-black"
      style={{ fontFamily: "var(--font-inter)" }}
    >
      {/* Dynamic background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div 
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[140px] animate-pulse"
          style={{ background: `radial-gradient(circle, ${diffColor}15 0%, transparent 70%)` }}
        />
        <div 
          className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full blur-[140px] animate-pulse"
          style={{ background: `radial-gradient(circle, var(--accent)10 0%, transparent 70%)`, animationDelay: '2s' }}
        />
      </div>

      {/* Toast stack */}
      <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-4 items-end">
        {toasts.map((t) => (
          <SolveToast key={t.id} item={t} onExpire={() => dismissToast(t.id)} />
        ))}
      </div>

      {/* Modern Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.05] bg-[var(--header-bg)] backdrop-blur-2xl px-6 sm:px-12 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="font-black text-[1.7rem] tracking-[6px] text-white hover:text-[var(--accent)] transition-all no-underline"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            100X<span className="text-[var(--accent)]">CONTEST</span>
          </Link>
          <span className="w-[1px] h-8 bg-white/10 hidden md:inline" />
          <nav className="hidden lg:flex items-center gap-6">
            <span className="font-mono text-[0.65rem] text-[var(--text-muted)] tracking-[5px] uppercase font-black opacity-30">
              LEADERBOARD ENGINE
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {status === "live" && (
            <div className="flex items-center gap-2.5 font-mono text-[0.65rem] text-[var(--accent)] bg-[var(--accent-bg)] border border-[var(--accent-border)] px-4 py-2 rounded-full font-black tracking-widest animate-in fade-in zoom-in slide-in-from-right-4 duration-500">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
              LIVE TELEMETRY
            </div>
          )}
          <div className="hidden sm:flex flex-col items-end opacity-20">
             <span className="font-mono text-[0.55rem] font-black tracking-widest uppercase">SYDNC_ID: {Math.random().toString(36).slice(2, 10).toUpperCase()}</span>
             <span className="font-mono text-[0.6rem] text-[var(--text-muted)] tabular-nums font-black">
                {lastUpdate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
             </span>
          </div>
          <Link
            href="/contests"
            className="font-mono text-[0.65rem] text-white border border-white/10 px-5 py-2.5 rounded-2xl hover:border-[var(--accent-border)] hover:text-[var(--accent)] transition-all no-underline bg-white/5 flex items-center gap-2 font-black tracking-widest uppercase"
          >
            ← CONTESTS
          </Link>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-14 space-y-12 relative z-10">

        {/* Contest selector and Sort */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-mono text-[0.65rem] text-[var(--text-muted)] tracking-[5px] uppercase font-black opacity-20 whitespace-nowrap">Active Operations</span>
                <div className="h-[1px] flex-1 bg-white/5" />
              </div>
              <div className="flex gap-3 flex-wrap">
                {contests.map((c) => (
                  <ContestPill
                    key={c.id}
                    contest={c}
                    active={c.id === contestId}
                    onClick={() => setContestId(c.id)}
                  />
                ))}
              </div>
            </div>
            
            <div className="lg:col-span-4 flex flex-col gap-4">
                <span className="font-mono text-[0.65rem] text-[var(--text-muted)] tracking-[5px] uppercase font-black opacity-20 text-right">Alignment Matrix</span>
                <div className="flex gap-2 justify-end">
                    {(["score", "firstSolve"] as const).map((s) => (
                    <button
                        key={s}
                        onClick={() => setSortBy(s)}
                        className={`font-mono text-[0.65rem] tracking-[3px] uppercase px-5 py-3 rounded-2xl border transition-all font-black ${sortBy === s
                        ? "bg-[var(--accent)] text-black border-[var(--accent)] shadow-xl"
                        : "text-[var(--text-muted)] border-white/5 hover:border-[var(--accent-border)] hover:text-white bg-white/5"
                        }`}
                    >
                        {s === "score" ? "POINTS" : "SPEED"}
                    </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-3xl px-8 py-5 font-mono text-[0.8rem] text-red-500 flex items-center justify-between shadow-2xl backdrop-blur-md animate-in shake duration-500">
            <div className="flex items-center gap-4">
              <span className="text-xl">⚠️</span>
              <span className="font-black tracking-widest">{error.toUpperCase()}</span>
            </div>
            <button onClick={() => load(false)} className="underline hover:text-red-400 font-black uppercase tracking-[3px]">
              FORCE_RETRY
            </button>
          </div>
        )}

        {/* Hero Section */}
        {contest && (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] to-transparent opacity-0 group-hover:opacity-5 transition-opacity blur-2xl rounded-3xl" />
            <div className="relative">
              <h1
                className="font-black leading-[0.85] mb-6 text-white tracking-tighter"
                style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(4rem, 12vw, 9rem)" }}
              >
                {contest.title.toUpperCase()}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <span
                  className={`font-mono text-[0.7rem] tracking-[3px] font-black uppercase px-6 py-2.5 rounded-full border-2 ${status === "live"
                    ? "text-[var(--accent)] border-[var(--accent)] bg-[var(--accent-bg)] shadow-[0_0_20px_-5px_var(--accent)]"
                    : status === "upcoming"
                      ? "text-orange-400 border-orange-400/30 bg-orange-400/10"
                      : "text-[var(--text-muted)] border-white/10 bg-white/5"
                    }`}
                >
                  {status === "live" ? "● LIVE STREAM" : status === "upcoming" ? "▷ SCHEDULED" : "✓ FINALIZED"}
                </span>
                <span
                  className="font-mono text-[0.7rem] px-6 py-2.5 rounded-full border-2 font-black tracking-[3px] uppercase"
                  style={{ color: diffColor, borderColor: `${diffColor}44`, background: `${diffColor}08` }}
                >
                  {contest.difficulty} DIFFICULTY
                </span>
                {contest.prize > 0 && (
                  <span className="font-mono text-[0.7rem] text-black font-black tracking-[3px] uppercase bg-[var(--accent)] px-6 py-2.5 rounded-full shadow-lg shadow-[var(--accent-bg)]">
                    ${contest.prize.toLocaleString()} BOUNTY
                  </span>
                )}
                {contest.host && (
                  <span className="font-mono text-[0.65rem] text-[var(--text-muted)] font-black uppercase tracking-[5px] opacity-20 ml-2">HOST_SIGNATURE: {contest.host.toUpperCase()}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
            <StatCard
              label="PARTICIPANTS"
              value={data.stats.totalParticipants.toString()}
              sub="registered combatants"
            />
            <StatCard
              label="AVG_PERFORMANCE"
              value={`${data.stats.avgScorePct}%`}
              sub="fleet effectiveness"
              accent="var(--accent)"
            />
            <StatCard
              label="APEX_SCORE"
              value={data.stats.topScore.toString()}
              sub={`of ${data.stats.maxPossible} max potential`}
              accent="var(--accent)"
            />
            <StatCard
              label="PERFECT_RUNS"
              value={data.stats.fullSolveCount.toString()}
              sub="flawless challenge records"
            />
            <StatCard
              label="CONTEST_MODIER"
              value={contest?.difficulty?.toUpperCase() || "N/A"}
              sub="current difficulty scale"
              accent="#f97316"
            />
          </div>
        )}

        {/* Secondary Grid — Table & Metadata */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
          
          {/* Standings Table container */}
          <div className="xl:col-span-8 space-y-6">
            <div className="flex items-center gap-4">
               <h2 className="text-2xl font-black tracking-tight text-white uppercase italic" style={{ fontFamily: "var(--font-bebas)" }}>Live Frequency Analysis</h2>
               <div className="flex-1 h-[1px] bg-white/10" />
            </div>

            <div className="border border-white/10 rounded-[2.5rem] overflow-hidden bg-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      {["#", "PARTICIPANT", "CHALLENGES", "RAW_SCORE", "RATING", "ACTIVITY", ""].map((h) => (
                        <th
                          key={h}
                          className={`font-mono text-[0.65rem] text-[var(--text-muted)] tracking-[4px] uppercase text-left px-8 py-6 whitespace-nowrap font-black border-r border-white/5 last:border-0 ${h === "RATING" || h === "ACTIVITY" ? "hidden md:table-cell" : ""}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-8 py-32 text-center">
                          <div className="flex flex-col items-center gap-6">
                            <div className="w-12 h-12 rounded-full border-[6px] border-[var(--accent-border)] border-t-[var(--accent)] animate-spin shadow-glow" />
                            <span className="font-mono text-[0.9rem] text-white font-black tracking-[6px] uppercase animate-pulse">Establishing Link...</span>
                          </div>
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-8 py-32 text-center">
                          <p className="font-mono text-[1rem] text-white font-black uppercase tracking-[8px] mb-4 opacity-50 italic">Zero Signals</p>
                          <p className="font-mono text-[0.7rem] text-[var(--text-muted)] font-black uppercase tracking-[4px] opacity-20">Waiting for first confirmed submission packet</p>
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => {
                        const isExpanded = expandedUserId === row.userId;
                        const scoreColor =
                          row.scorePct >= 85
                            ? "#c8f135"
                            : row.scorePct >= 50
                              ? "#f5a623"
                              : "#ef4444";

                        return (
                          <Suspense key={row.userId} fallback={null}>
                            <tr
                              onClick={() => setExpandedUserId(isExpanded ? null : row.userId)}
                              className={`cursor-pointer transition-all duration-300 group relative border-l-4 ${isExpanded
                                ? "bg-white/10 border-l-[var(--accent)]"
                                : "hover:bg-white/5 border-l-transparent"
                                }`}
                            >
                              {/* Rank */}
                              <td className="px-8 py-6 w-20">
                                <RankBadge rank={row.rank} />
                              </td>

                              {/* Participant */}
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-5">
                                  <Avatar row={row} size={48} />
                                  <div className="min-w-0">
                                    <p className="text-[1rem] font-black text-white truncate flex items-center gap-3">
                                      {displayHandle(row)}
                                      {row.country && (
                                        <span className="text-[0.6rem] font-mono text-[var(--accent)] font-black tracking-widest uppercase bg-white/5 px-2 py-0.5 rounded border border-white/10">{row.country}</span>
                                      )}
                                    </p>
                                    <p className="font-mono text-[0.7rem] text-[var(--text-muted)] truncate font-bold mt-1 opacity-30">
                                      {row.email.toUpperCase()}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Challenge pips */}
                              <td className="px-8 py-6">
                                <div className="flex gap-2.5 items-center flex-wrap">
                                  {row.challengeScores.map((cs) => (
                                    <VerdictPip key={cs.challengeId} cs={cs} />
                                  ))}
                                </div>
                                <p className="font-mono text-[0.62rem] text-[var(--text-muted)] mt-2.5 font-black uppercase tracking-widest opacity-20">
                                  {row.challengeScores.filter((c) => c.verdict === "full" || c.verdict === "partial").length}
                                  /{row.challengeScores.length} COMPLETED
                                </p>
                              </td>

                              {/* Score */}
                              <td className="px-8 py-6 min-w-[180px]">
                                <div className="flex items-baseline justify-between mb-2">
                                  <span
                                    className="font-mono font-black text-[1.2rem] tracking-tighter"
                                    style={{ color: scoreColor }}
                                  >
                                    {row.totalScore}
                                  </span>
                                  <span className="font-mono text-[0.7rem] text-white/20 font-black">
                                    / {row.maxPossible} MAX
                                  </span>
                                </div>
                                <ScoreBar pct={row.scorePct} color={scoreColor} />
                                <div className="flex justify-between items-center mt-2">
                                  <span className="font-mono text-[0.65rem] font-black tracking-widest" style={{ color: scoreColor }}>
                                    MATERIA_PCT: {row.scorePct}%
                                  </span>
                                </div>
                              </td>

                              {/* Rating */}
                              <td className="px-8 py-6 hidden md:table-cell">
                                <span className="font-mono text-[0.95rem] text-[var(--accent)] font-black tracking-widest">
                                  {row.rating}
                                </span>
                              </td>

                              {/* Last activity */}
                              <td className="px-8 py-6 hidden lg:table-cell whitespace-nowrap">
                                <span className="font-mono text-[0.7rem] text-[var(--text-muted)] font-black opacity-30 uppercase tracking-[2px]">
                                  {row.lastActivityAt ? relativeTime(row.lastActivityAt) : "—"}
                                </span>
                              </td>

                              {/* Expand chevron */}
                              <td className="px-8 py-6 text-right">
                                <span
                                  className={`inline-block font-mono text-[0.8rem] text-white/20 group-hover:text-white transition-all duration-300 ${isExpanded ? "rotate-180 text-[var(--accent)] opacity-100" : ""
                                    }`}
                                >
                                  ▼
                                </span>
                              </td>
                            </tr>

                            {isExpanded && (
                              <ExpandedPanel key={`${row.userId}-panel`} row={row} />
                            )}
                          </Suspense>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Large Sidebar — Stats & Legend */}
          <div className="xl:col-span-4 space-y-10">
            
            {/* Histogram */}
            {data && data.leaderboard.length > 0 && (
              <ScoreDistribution rows={data.leaderboard} maxPossible={data.stats.maxPossible} />
            )}

            {/* Detailed Challenge Index */}
            {data && data.challenges.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 shadow-2xl backdrop-blur-md">
                <p className="font-mono text-[0.65rem] text-[var(--text-muted)] tracking-[5px] uppercase mb-8 font-black opacity-30">Challenge Index Matrix</p>
                <div className="space-y-6">
                  {data.challenges.map((ch, i) => (
                    <div key={ch.id} className="flex items-start gap-5 group">
                      <span className="font-mono text-[0.7rem] text-[var(--accent)] font-black bg-[var(--accent-bg)] border border-[var(--accent-border)] rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--accent)] group-hover:text-black transition-all group-hover:rotate-[360deg] duration-500 shadow-lg">
                        C{i + 1}
                      </span>
                      <div className="min-w-0 flex-1 border-b border-white/5 pb-4 last:border-0 group-hover:border-[var(--accent-border)]/30 transition-colors">
                        <p className="text-[1rem] font-black text-white truncate leading-tight group-hover:text-[var(--accent)] transition-colors">{ch.title.toUpperCase()}</p>
                        <p className="font-mono text-[0.65rem] text-[var(--text-muted)] font-black uppercase tracking-[3px] mt-1.5 opacity-30 group-hover:opacity-60">{ch.maxPoints} UNITS MAX</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verdict Key */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 shadow-2xl border-dashed">
              <p className="font-mono text-[0.65rem] text-[var(--text-muted)] tracking-[5px] uppercase mb-8 font-black opacity-30">System Verdict Hash</p>
              <div className="space-y-4">
                {(Object.entries(VERDICT_LABELS) as [Verdict, string][]).map(([v, label]) => (
                  <div key={v} className="flex items-center gap-4 group">
                    <div
                      className={`w-5 h-5 rounded-lg border-2 shadow-xl group-hover:scale-125 transition-transform ${v === "judging" ? "animate-pulse" : ""}`}
                      style={{
                        background: v === "unattempted" ? "transparent" : VERDICT_COLORS[v],
                        borderColor: v === "unattempted" ? "white/10" : VERDICT_COLORS[v],
                      }}
                    />
                    <span className="font-mono text-[0.75rem] text-white font-black uppercase tracking-[3px] group-hover:text-[var(--accent)] transition-all">{label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10 p-5 bg-white/5 rounded-2xl border border-white/5">
                <p className="font-mono text-[0.65rem] text-[var(--text-muted)] italic leading-relaxed font-bold opacity-30">
                  SYSTEM_ALERT: ALL HUD ELEMENTS ARE DYNAMIC. PIP CLUSTERS IN STANDINGS MATRIX PROVIDE RE-FETCHED TELEMETRY ON INTERACTION. EXPAND ROWS FOR RAW JSON_BREAKDOWN.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Global Footer */}
        <div className="flex flex-col items-center justify-center pt-20 border-t border-white/5 gap-4 opacity-10">
          <p className="font-mono text-[0.65rem] font-black tracking-[12px] uppercase text-center">CRYPTO_CONTEST_HUD_MODULE_CORE_V4.2.1</p>
          <p className="font-mono text-[0.5rem] font-black uppercase tracking-[4px]">PROTECTED BY 100X_SECURITY_PROTOCOLS // ALL SIGNALS ENCRYPTED</p>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        
        :root {
          --font-syne: 'Syne', sans-serif;
          --font-bebas: 'Bebas Neue', cursive;
          --font-inter: 'Inter', sans-serif;
        }

        @keyframes toastIn {
          from { opacity: 0; transform: translateY(3rem) rotate(5deg) scale(0.9); }
          to   { opacity: 1; transform: translateY(0) rotate(0) scale(1); }
        }

        .shadow-glow {
          box-shadow: 0 0 25px var(--accent-bg);
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.05);
          border-radius: 20px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: var(--accent);
          background-clip: content-box;
        }
        
        html {
          scrollbar-gutter: stable;
        }
      `}</style>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-[8px] border-white/5 border-t-[var(--accent)] animate-spin shadow-glow" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-white/10" />
            </div>
          </div>
          <span className="font-mono text-[1rem] text-white font-black tracking-[8px] uppercase animate-pulse opacity-50">SYNCING_MATRIX</span>
        </div>
      </div>
    }>
      <LeaderboardContent />
    </Suspense>
  );
}
