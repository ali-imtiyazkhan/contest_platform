"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Contest {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  category?: string;
  difficulty?: string;
  prize?: number;
  maxParticipants?: number;
  host?: string;
  tags?: string[];
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  email: string;
  score: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1/api";

async function fetchContests(): Promise<Contest[]> {
  const res = await fetch(`${API_BASE}/contests`);
  const json = await res.json();
  return json.ok ? json.data : [];
}

async function fetchLeaderboard(contestId: string): Promise<LeaderboardEntry[]> {
  const res = await fetch(`${API_BASE}/contests/${contestId}/leaderboard`);
  const json = await res.json();
  return json.ok ? json.leaderboard : [];
}

function getContestStatus(contest: Contest): "live" | "upcoming" | "finished" {
  const now = Date.now();
  const start = new Date(contest.startTime).getTime();
  const end = new Date(contest.endTime).getTime();
  if (now < start) return "upcoming";
  if (now > end) return "finished";
  return "live";
}

function avatarColor(userId: string): string {
  // Deterministic color from userId
  const colors = [
    "#c8f135", "#4f86f7", "#e8554e", "#a855f7", "#14b8a6",
    "#f5a623", "#f43f5e", "#60a5fa", "#34d399", "#fb923c",
    "#e879f9", "#38bdf8",
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatEmail(email: string): string {
  return email.split("@")[0];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MedalIcon({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-[1.1rem]">🥇</span>;
  if (rank === 2) return <span className="text-[1.1rem]">🥈</span>;
  if (rank === 3) return <span className="text-[1.1rem]">🥉</span>;
  return (
    <span className="font-mono text-[0.78rem] text-muted w-6 text-center inline-block">
      {rank}
    </span>
  );
}

function ScoreBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden w-full">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, pct)}%`, background: color }}
      />
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-5 py-4">
      <div className="font-mono text-[0.6rem] text-muted tracking-[2px] uppercase mb-2">{label}</div>
      <div className="text-cream font-extrabold text-2xl leading-none" style={{ fontFamily: "'Bebas Neue', cursive" }}>{value}</div>
      {sub && <div className="font-mono text-[0.62rem] text-muted mt-1">{sub}</div>}
    </div>
  );
}

function ContestSelector({
  contests,
  selected,
  onChange,
}: {
  contests: Contest[];
  selected: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {contests.map(c => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={`font-mono text-[0.65rem] tracking-[1.5px] uppercase px-3 py-1.5 rounded-sm border transition-all duration-150 ${selected === c.id
              ? "bg-acid text-black border-acid"
              : "text-muted border-white/[0.08] hover:border-white/20 hover:text-cream"
            }`}
        >
          {c.title}
        </button>
      ))}
    </div>
  );
}

function ScoreDistribution({ entries, maxScore }: { entries: LeaderboardEntry[]; maxScore: number }) {
  const buckets = [0, 0, 0, 0, 0];
  entries.forEach(e => {
    const pct = maxScore > 0 ? Math.round((e.score / maxScore) * 100) : 0;
    const idx = Math.min(4, Math.floor(pct / 20));
    buckets[idx]++;
  });
  const max = Math.max(...buckets, 1);
  const labels = ["0–20%", "20–40%", "40–60%", "60–80%", "80–100%"];
  const colors = ["#ef4444", "#f97316", "#f5a623", "#a3e635", "#c8f135"];

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-5">
      <div className="font-mono text-[0.6rem] text-muted tracking-[2px] uppercase mb-4">Score Distribution</div>
      <div className="flex items-end gap-2 h-24">
        {buckets.map((count, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="font-mono text-[0.6rem] text-muted">{count}</span>
            <div
              className="w-full rounded-t transition-all duration-700"
              style={{ height: `${(count / max) * 72}px`, background: colors[i], minHeight: count > 0 ? "4px" : "0" }}
            />
            <span className="font-mono text-[0.55rem] text-muted/60 text-center">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const searchParams = useSearchParams();

  const [contests, setContests] = useState<Contest[]>([]);
  const [contestId, setContestId] = useState<string>(searchParams.get("contestId") ?? "");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Load contests once
  useEffect(() => {
    fetchContests()
      .then(data => {
        setContests(data);
        if (!contestId && data.length > 0) setContestId(data[0].id);
      })
      .catch(() => setError("Failed to load contests"));
  }, []);

  const contest = contests.find(c => c.id === contestId);
  const status = contest ? getContestStatus(contest) : null;

  // Load leaderboard whenever contestId changes
  const loadLeaderboard = useCallback(async () => {
    if (!contestId) return;
    try {
      setLoading(true);
      const data = await fetchLeaderboard(contestId);
      setLeaderboard(data);
      setLastUpdate(new Date());
      setError(null);
    } catch {
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);

  // Auto-refresh every 8s for live contests
  useEffect(() => {
    if (status !== "live") return;
    const id = setInterval(loadLeaderboard, 8000);
    return () => clearInterval(id);
  }, [status, loadLeaderboard]);

  // Derived stats
  const maxScore = leaderboard.length > 0 ? Math.max(...leaderboard.map(e => e.score)) : 0;
  const avgPct = leaderboard.length > 0
    ? Math.round(leaderboard.reduce((s, e) => s + (maxScore > 0 ? (e.score / maxScore) * 100 : 0), 0) / leaderboard.length)
    : 0;
  const topScore = leaderboard[0]?.score ?? 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-cream" style={{ fontFamily: "'Syne', sans-serif" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/80 backdrop-blur-sm px-6 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="font-extrabold text-[1.5rem] tracking-[3px] text-cream hover:text-acid transition-colors no-underline flex-shrink-0"
            style={{ fontFamily: "'Bebas Neue', cursive" }}
          >
            Arena<span className="text-acid">X</span>
          </Link>
          <span className="text-white/10 hidden md:block">|</span>
          <span className="font-mono text-[0.7rem] text-muted hidden md:block">Leaderboard</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {status === "live" && (
            <span className="flex items-center gap-1.5 font-mono text-[0.65rem] text-acid bg-acid/10 border border-acid/20 px-2.5 py-1 rounded-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-acid animate-ping" />
              Live · Updates every 8s
            </span>
          )}
          <span className="font-mono text-[0.62rem] text-muted hidden sm:block">
            {lastUpdate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          <Link
            href="/contests"
            className="font-mono text-[0.65rem] text-muted border border-white/[0.1] px-3 py-1.5 rounded hover:border-acid/40 hover:text-acid transition-colors no-underline"
          >
            ← Contests
          </Link>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-8">

        {/* ── Contest selector ── */}
        <div>
          <div className="font-mono text-[0.62rem] text-muted tracking-[2px] uppercase mb-3">Select Contest</div>
          <ContestSelector contests={contests} selected={contestId} onChange={setContestId} />
        </div>

        {/* ── Error state ── */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-5 py-4 font-mono text-[0.75rem] text-red-400">
            {error} —{" "}
            <button onClick={loadLeaderboard} className="underline hover:text-red-300">
              retry
            </button>
          </div>
        )}

        {/* ── Contest title + meta ── */}
        {contest && (
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h1
                className="text-cream font-extrabold leading-tight mb-1"
                style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
              >
                {contest.title}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={`font-mono text-[0.65rem] tracking-[2px] uppercase px-2.5 py-1 rounded-sm border ${status === "live"
                      ? "text-acid border-acid/30 bg-acid/10"
                      : status === "upcoming"
                        ? "text-orange-400 border-orange-400/30 bg-orange-400/10"
                        : "text-muted border-white/15 bg-white/[0.05]"
                    }`}
                >
                  {status === "live" ? "● Live" : status === "upcoming" ? "◷ Upcoming" : "✓ Completed"}
                </span>
                {contest.difficulty && (
                  <span className="font-mono text-[0.65rem] text-muted">{contest.difficulty}</span>
                )}
                <span className="font-mono text-[0.65rem] text-muted">{leaderboard.length} participants</span>
                {contest.prize != null && contest.prize > 0 && (
                  <span className="font-mono text-[0.65rem] text-acid font-bold">${contest.prize} prize pool</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Participants" value={leaderboard.length.toString()} sub="on leaderboard" />
          <StatCard label="Avg Score %" value={`${avgPct}%`} sub="relative to top score" />
          <StatCard label="Top Score" value={topScore.toString()} sub="highest points" />
          <StatCard
            label="Prize Pool"
            value={contest?.prize ? `$${contest.prize}` : "—"}
            sub={contest?.difficulty ?? ""}
          />
        </div>

        {/* ── Score distribution ── */}
        {leaderboard.length > 0 && (
          <ScoreDistribution entries={leaderboard} maxScore={maxScore} />
        )}

        {/* ── Table controls ── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="font-mono text-[0.65rem] text-muted tracking-[2px] uppercase">
            Rankings · {leaderboard.length} participants
          </div>
        </div>

        {/* ── Leaderboard Table ── */}
        <div className="border border-white/[0.06] rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/[0.04] border-b border-white/[0.07]">
                {["Rank", "Participant", "Score", ""].map(h => (
                  <th
                    key={h}
                    className="font-mono text-[0.6rem] text-muted tracking-[2px] uppercase text-left px-4 py-3 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <span className="font-mono text-[0.75rem] text-muted animate-pulse">Loading leaderboard…</span>
                  </td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <span className="font-mono text-[0.75rem] text-muted">No entries yet.</span>
                  </td>
                </tr>
              ) : (
                leaderboard.map(entry => {
                  const scorePct = maxScore > 0 ? Math.round((entry.score / maxScore) * 100) : 0;
                  const scoreColor =
                    scorePct >= 85 ? "#c8f135" : scorePct >= 50 ? "#f5a623" : "#ef4444";
                  const color = avatarColor(entry.userId);
                  const handle = formatEmail(entry.email);
                  const initial = (entry.email[0] ?? "?").toUpperCase();

                  return (
                    <tr
                      key={entry.userId}
                      className="border-b border-white/[0.05] transition-colors duration-150 hover:bg-white/[0.03]"
                    >
                      {/* Rank */}
                      <td className="px-4 py-4 w-12">
                        <MedalIcon rank={entry.rank} />
                      </td>

                      {/* Participant */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[0.75rem] font-bold text-black flex-shrink-0"
                            style={{ background: color }}
                          >
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[0.88rem] truncate text-cream">
                              {entry.email}
                            </div>
                            <div className="font-mono text-[0.65rem] text-muted truncate">@{handle}</div>
                          </div>
                        </div>
                      </td>

                      {/* Score */}
                      <td className="px-4 py-4 min-w-[160px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[0.78rem] font-bold" style={{ color: scoreColor }}>
                            {entry.score}
                          </span>
                          <span className="font-mono text-[0.65rem] text-muted">pts</span>
                        </div>
                        <ScoreBar pct={scorePct} color={scoreColor} />
                        <div className="font-mono text-[0.58rem] mt-1" style={{ color: scoreColor }}>
                          {scorePct}% of top score
                        </div>
                      </td>

                      {/* Rank badge for top 3 */}
                      <td className="px-4 py-4 text-right">
                        {entry.rank <= 3 && (
                          <span
                            className="font-mono text-[0.6rem] tracking-[1.5px] uppercase px-2 py-0.5 rounded-sm border"
                            style={{
                              color: entry.rank === 1 ? "#fbbf24" : entry.rank === 2 ? "#9ca3af" : "#b45309",
                              borderColor: entry.rank === 1 ? "#fbbf2440" : entry.rank === 2 ? "#9ca3af40" : "#b4530940",
                            }}
                          >
                            {entry.rank === 1 ? "Gold" : entry.rank === 2 ? "Silver" : "Bronze"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center gap-5 flex-wrap pb-8">
          <div className="font-mono text-[0.6rem] text-muted/50 ml-auto">
            Last updated: {lastUpdate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
        </div>
      </div>
    </div>
  );
}