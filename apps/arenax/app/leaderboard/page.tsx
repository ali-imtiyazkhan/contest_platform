"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CONTESTS, Contest } from "@/lib/contestData";


interface ChallengeScore {
  challengeId: string;
  title: string;
  maxPoints: number;
  awarded: number;
  verdict: "full" | "partial" | "zero" | "pending";
}

interface Participant {
  id: string;
  rank: number;
  name: string;
  handle: string;
  avatar: string;
  avatarColor: string;
  country: string;
  totalPoints: number;
  maxPoints: number;
  completedCount: number;
  totalChallenges: number;
  timeTaken: string; // e.g. "14m 32s"
  challengeScores: ChallengeScore[];
  isYou?: boolean;
  trend: "up" | "down" | "same";
  trendAmount: number;
}


function generateLeaderboard(contest: Contest): Participant[] {
  const names = [
    { name: "Yuki Sato", handle: "yukis", color: "#c8f135", country: "🇯🇵" },
    { name: "Priya Kapoor", handle: "priyak", color: "#4f86f7", country: "🇮🇳" },
    { name: "Carlos Batista", handle: "carlosb", color: "#e8554e", country: "🇧🇷" },
    { name: "You", handle: "you", color: "#a855f7", country: "🌐", isYou: true },
    { name: "Lena Müller", handle: "lenam", color: "#14b8a6", country: "🇩🇪" },
    { name: "Dev Rao", handle: "devrao", color: "#f5a623", country: "🇮🇳" },
    { name: "Sofia Andersen", handle: "sofiaa", color: "#f43f5e", country: "🇩🇰" },
    { name: "Marcos Tavares", handle: "marcost", color: "#60a5fa", country: "🇵🇹" },
    { name: "Amara Nwosu", handle: "amaran", color: "#34d399", country: "🇳🇬" },
    { name: "James Liu", handle: "jamesl", color: "#fb923c", country: "🇺🇸" },
    { name: "Aria Bergström", handle: "ariab", color: "#e879f9", country: "🇸🇪" },
    { name: "Omar Hassan", handle: "omarh", color: "#38bdf8", country: "🇪🇬" },
  ];

  const maxPoints = contest.challenges.reduce((a, c) => a + c.points, 0);
  const trends: Array<"up" | "down" | "same"> = ["up", "same", "down", "up", "up", "same", "down", "up", "same", "down", "up", "same"];

  return names.map((person, i) => {
    const baseScore = Math.max(0, 1 - i * 0.08);
    const jitter = (Math.random() - 0.5) * 0.12;
    const scoreFraction = Math.min(1, Math.max(0.1, baseScore + jitter));
    const totalPoints = i === 3 ? Math.floor(maxPoints * 0.71) : Math.round(maxPoints * scoreFraction);

    const challengeScores: ChallengeScore[] = contest.challenges.map((ch, ci) => {
      const fraction = Math.min(1, Math.max(0, scoreFraction - ci * 0.05 + (Math.random() - 0.5) * 0.1));
      const pct = Math.round(fraction * 100);
      const awarded = Math.round((pct / 100) * ch.points);
      const verdict: ChallengeScore["verdict"] =
        pct >= 85 ? "full" : pct >= 20 ? "partial" : i > 8 && ci > 2 ? "pending" : "zero";
      return { challengeId: ch.id, title: ch.title, maxPoints: ch.points, awarded, verdict };
    });

    const completedCount = challengeScores.filter(s => s.verdict !== "pending").length;
    const mins = 8 + i * 2 + Math.floor(Math.random() * 3);
    const secs = Math.floor(Math.random() * 60);

    return {
      id: `p${i}`,
      rank: i + 1,
      name: person.name,
      handle: person.handle,
      avatar: person.name[0],
      avatarColor: person.color,
      country: person.country,
      totalPoints,
      maxPoints,
      completedCount,
      totalChallenges: contest.challenges.length,
      timeTaken: `${mins}m ${String(secs).padStart(2, "0")}s`,
      challengeScores,
      isYou: (person as { isYou?: boolean }).isYou,
      trend: trends[i],
      trendAmount: [0, 0, 1, 2, 0, 1, 3, 0, 2, 1, 0, 4][i],
    };
  });
}

// ─────────────────────────────────────────────
// UI Helpers
// ─────────────────────────────────────────────
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

function TrendBadge({ trend, amount }: { trend: Participant["trend"]; amount: number }) {
  if (trend === "same" || amount === 0) return <span className="font-mono text-[0.6rem] text-muted">—</span>;
  return (
    <span className={`font-mono text-[0.62rem] font-bold flex items-center gap-0.5 ${trend === "up" ? "text-acid" : "text-red-400"}`}>
      {trend === "up" ? "▲" : "▼"}{amount}
    </span>
  );
}

function VerdictPip({ verdict }: { verdict: ChallengeScore["verdict"] }) {
  const map = {
    full: "bg-acid",
    partial: "bg-amber-400",
    zero: "bg-red-500",
    pending: "bg-white/20",
  };
  return (
    <div className="group relative">
      <div className={`w-2.5 h-2.5 rounded-sm ${map[verdict]}`} />
    </div>
  );
}

function ScoreBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden w-full">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function ContestSelector({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {CONTESTS.map(c => (
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

// ─────────────────────────────────────────────
// Expanded row — per-challenge breakdown
// ─────────────────────────────────────────────
function ExpandedRow({ participant }: { participant: Participant }) {
  return (
    <tr>
      <td colSpan={8} className="px-4 pb-4 pt-0">
        <div className="bg-black/30 border border-white/[0.06] rounded-lg p-4 ml-8">
          <div className="font-mono text-[0.6rem] text-muted tracking-[2px] uppercase mb-3">Challenge Breakdown</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {participant.challengeScores.map(cs => {
              const pct = cs.maxPoints > 0 ? Math.round((cs.awarded / cs.maxPoints) * 100) : 0;
              const color = cs.verdict === "full" ? "#c8f135" : cs.verdict === "partial" ? "#f5a623" : cs.verdict === "zero" ? "#ef4444" : "#666";
              return (
                <div key={cs.challengeId} className="bg-white/[0.03] border border-white/[0.05] rounded p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-cream text-[0.78rem] font-semibold truncate pr-2">{cs.title}</span>
                    <span className="font-mono text-[0.68rem] font-bold flex-shrink-0" style={{ color }}>
                      {cs.verdict === "pending" ? "—" : `${cs.awarded}/${cs.maxPoints}`}
                    </span>
                  </div>
                  <ScoreBar pct={cs.verdict === "pending" ? 0 : pct} color={color} />
                  <div className="font-mono text-[0.58rem] mt-1.5 capitalize" style={{ color }}>
                    {cs.verdict === "full" ? "Full marks" : cs.verdict === "partial" ? `${pct}% — partial credit` : cs.verdict === "zero" ? "No marks awarded" : "Not attempted"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-5 py-4">
      <div className="font-mono text-[0.6rem] text-muted tracking-[2px] uppercase mb-2">{label}</div>
      <div className="text-cream font-extrabold text-2xl leading-none" style={{ fontFamily: "'Bebas Neue', cursive" }}>{value}</div>
      {sub && <div className="font-mono text-[0.62rem] text-muted mt-1">{sub}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────
// Score Distribution bar chart
// ─────────────────────────────────────────────
function ScoreDistribution({ participants }: { participants: Participant[] }) {
  const buckets = [0, 0, 0, 0, 0]; // 0-20, 20-40, 40-60, 60-80, 80-100
  participants.forEach(p => {
    const pct = Math.round((p.totalPoints / p.maxPoints) * 100);
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

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function LeaderboardPage() {
  const searchParams = useSearchParams();
  const initialContest = searchParams.get("contestId") ?? CONTESTS[0].id;

  const [contestId, setContestId] = useState(initialContest);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"rank" | "time" | "completed">("rank");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [liveCount, setLiveCount] = useState(0);

  const contest = CONTESTS.find(c => c.id === contestId) ?? CONTESTS[0];

  const regenerate = useCallback(() => {
    const data = generateLeaderboard(contest);
    setParticipants(data);
    setLastUpdate(new Date());
    setLiveCount(c => c + Math.floor(Math.random() * 3));
  }, [contest]);

  useEffect(() => { regenerate(); }, [contestId, regenerate]);

  // Simulate live updates for live contests
  useEffect(() => {
    if (contest.status !== "live") return;
    const id = setInterval(regenerate, 8000);
    return () => clearInterval(id);
  }, [contest.status, regenerate]);

  const sorted = [...participants].sort((a, b) => {
    if (sortBy === "rank") return a.rank - b.rank;
    if (sortBy === "time") return a.timeTaken.localeCompare(b.timeTaken);
    return b.completedCount - a.completedCount;
  });

  const yourEntry = participants.find(p => p.isYou);
  const avgScore = participants.length > 0
    ? Math.round(participants.reduce((s, p) => s + Math.round((p.totalPoints / p.maxPoints) * 100), 0) / participants.length)
    : 0;
  const fullMarksCount = participants.reduce((s, p) => s + p.challengeScores.filter(c => c.verdict === "full").length, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-cream" style={{ fontFamily: "'Syne', sans-serif" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/80 backdrop-blur-sm px-6 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="font-extrabold text-[1.5rem] tracking-[3px] text-cream hover:text-acid transition-colors no-underline flex-shrink-0"
            style={{ fontFamily: "'Bebas Neue', cursive" }}>
            Arena<span className="text-acid">X</span>
          </Link>
          <span className="text-white/10 hidden md:block">|</span>
          <span className="font-mono text-[0.7rem] text-muted hidden md:block">Leaderboard</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {contest.status === "live" && (
            <span className="flex items-center gap-1.5 font-mono text-[0.65rem] text-acid bg-acid/10 border border-acid/20 px-2.5 py-1 rounded-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-acid animate-ping" />
              Live · Updates every 8s
            </span>
          )}
          <span className="font-mono text-[0.62rem] text-muted hidden sm:block">
            {lastUpdate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          <Link href="/contests"
            className="font-mono text-[0.65rem] text-muted border border-white/[0.1] px-3 py-1.5 rounded hover:border-acid/40 hover:text-acid transition-colors no-underline">
            ← Contests
          </Link>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-8">

        {/* ── Contest selector ── */}
        <div>
          <div className="font-mono text-[0.62rem] text-muted tracking-[2px] uppercase mb-3">Select Contest</div>
          <ContestSelector selected={contestId} onChange={setContestId} />
        </div>

        {/* ── Contest title + meta ── */}
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-cream font-extrabold leading-tight mb-1"
              style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
              {contest.title}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`font-mono text-[0.65rem] tracking-[2px] uppercase px-2.5 py-1 rounded-sm border ${contest.status === "live" ? "text-acid border-acid/30 bg-acid/10"
                  : contest.status === "upcoming" ? "text-orange-400 border-orange-400/30 bg-orange-400/10"
                    : "text-muted border-white/15 bg-white/[0.05]"
                }`}>
                {contest.status === "live" ? "● Live" : contest.status === "upcoming" ? "◷ Upcoming" : "✓ Completed"}
              </span>
              <span className="font-mono text-[0.65rem] text-muted">{contest.difficulty}</span>
              <span className="font-mono text-[0.65rem] text-muted">{participants.length} participants</span>
              <span className="font-mono text-[0.65rem] text-acid font-bold">{contest.prize} prize pool</span>
            </div>
          </div>

          {/* Your rank snapshot */}
          {yourEntry && (
            <div className="bg-acid/[0.07] border border-acid/25 rounded-xl px-6 py-4 flex items-center gap-5 flex-shrink-0">
              <div>
                <div className="font-mono text-[0.6rem] text-acid/70 tracking-[2px] uppercase mb-1">Your Rank</div>
                <div className="text-acid font-extrabold leading-none" style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "3rem" }}>
                  #{yourEntry.rank}
                </div>
              </div>
              <div className="border-l border-acid/20 pl-5">
                <div className="font-mono text-[0.6rem] text-muted tracking-widest uppercase mb-1">Score</div>
                <div className="text-cream font-bold text-xl">{yourEntry.totalPoints}<span className="text-muted text-sm">/{yourEntry.maxPoints}</span></div>
                <div className="font-mono text-[0.65rem] text-muted mt-0.5">
                  {yourEntry.completedCount}/{yourEntry.totalChallenges} challenges done
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Participants" value={participants.length.toString()} sub="active in contest" />
          <StatCard label="Avg Score" value={`${avgScore}%`} sub="across all players" />
          <StatCard label="Full Marks" value={fullMarksCount.toString()} sub="challenge completions" />
          <StatCard label="Prize Pool" value={contest.prize} sub={contest.difficulty} />
        </div>

        {/* ── Score distribution ── */}
        <ScoreDistribution participants={participants} />

        {/* ── Table controls ── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="font-mono text-[0.65rem] text-muted tracking-[2px] uppercase">
            Rankings · {sorted.length} participants
          </div>
          <div className="flex gap-1.5">
            {(["rank", "time", "completed"] as const).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`font-mono text-[0.6rem] tracking-[1.5px] uppercase px-3 py-1.5 rounded-sm border transition-all ${sortBy === s ? "bg-acid text-black border-acid" : "text-muted border-white/[0.08] hover:border-white/20 hover:text-cream"
                  }`}
              >
                {s === "rank" ? "By Score" : s === "time" ? "By Speed" : "By Progress"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Leaderboard Table ── */}
        <div className="border border-white/[0.06] rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/[0.04] border-b border-white/[0.07]">
                {["Rank", "Participant", "Challenges", "Score", "Time", "Trend", ""].map(h => (
                  <th key={h} className="font-mono text-[0.6rem] text-muted tracking-[2px] uppercase text-left px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => {
                const isExpanded = expandedId === p.id;
                const scorePct = Math.round((p.totalPoints / p.maxPoints) * 100);
                const scoreColor = scorePct >= 85 ? "#c8f135" : scorePct >= 50 ? "#f5a623" : "#ef4444";

                return (
                  <>
                    <tr
                      key={p.id}
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                      className={`border-b border-white/[0.05] cursor-pointer transition-colors duration-150 group ${p.isYou ? "bg-acid/[0.05]" : "hover:bg-white/[0.03]"
                        } ${isExpanded ? "bg-white/[0.04]" : ""}`}
                    >
                      {/* Rank */}
                      <td className="px-4 py-4 w-12">
                        <div className="flex items-center gap-2">
                          <MedalIcon rank={p.rank} />
                        </div>
                      </td>

                      {/* Participant */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[0.75rem] font-bold text-black flex-shrink-0"
                            style={{ background: p.avatarColor }}
                          >
                            {p.avatar}
                          </div>
                          <div className="min-w-0">
                            <div className={`font-semibold text-[0.88rem] truncate ${p.isYou ? "text-acid" : "text-cream"}`}>
                              {p.name} {p.isYou && <span className="font-mono text-[0.6rem] text-acid/70 ml-1">(you)</span>}
                            </div>
                            <div className="font-mono text-[0.65rem] text-muted truncate">
                              {p.country} @{p.handle}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Challenge pips */}
                      <td className="px-4 py-4">
                        <div className="flex gap-1 items-center flex-wrap">
                          {p.challengeScores.map(cs => (
                            <VerdictPip key={cs.challengeId} verdict={cs.verdict} />
                          ))}
                        </div>
                        <div className="font-mono text-[0.58rem] text-muted mt-1">
                          {p.completedCount}/{p.totalChallenges}
                        </div>
                      </td>

                      {/* Score */}
                      <td className="px-4 py-4 min-w-[120px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[0.78rem] font-bold" style={{ color: scoreColor }}>
                            {p.totalPoints}
                          </span>
                          <span className="font-mono text-[0.65rem] text-muted">/{p.maxPoints}</span>
                        </div>
                        <ScoreBar pct={scorePct} color={scoreColor} />
                        <div className="font-mono text-[0.58rem] mt-1" style={{ color: scoreColor }}>{scorePct}%</div>
                      </td>

                      {/* Time */}
                      <td className="px-4 py-4">
                        <span className="font-mono text-[0.78rem] text-cream/70">{p.timeTaken}</span>
                      </td>

                      {/* Trend */}
                      <td className="px-4 py-4">
                        <TrendBadge trend={p.trend} amount={p.trendAmount} />
                      </td>

                      {/* Expand toggle */}
                      <td className="px-4 py-4">
                        <span className={`font-mono text-[0.6rem] text-muted/50 group-hover:text-muted transition-all duration-200 ${isExpanded ? "rotate-180 inline-block" : ""}`}>
                          ▼
                        </span>
                      </td>
                    </tr>

                    {/* Expanded breakdown row */}
                    {isExpanded && <ExpandedRow key={`${p.id}-expanded`} participant={p} />}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Legend ── */}
        <div className="flex items-center gap-5 flex-wrap pb-8">
          <div className="font-mono text-[0.6rem] text-muted tracking-[2px] uppercase">Challenge result key:</div>
          {[
            { color: "bg-acid", label: "Full marks" },
            { color: "bg-amber-400", label: "Partial credit" },
            { color: "bg-red-500", label: "No marks" },
            { color: "bg-white/20", label: "Not attempted" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
              <span className="font-mono text-[0.62rem] text-muted">{label}</span>
            </div>
          ))}
          <div className="font-mono text-[0.6rem] text-muted/50 ml-auto">Click any row to expand challenge breakdown</div>
        </div>
      </div>
    </div>
  );
}
