"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import { useParams } from "next/navigation";

// ── Types — mirror the backend response ──

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
    isTeam: boolean;
    teamId?: string | null;
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
    judging: "Judging…",
    unattempted: "Not attempted",
};

const DIFFICULTY_COLOR: Record<string, string> = {
    Beginner: "#34d399",
    Intermediate: "#f5a623",
    Advanced: "#f43f5e",
    Elite: "#a855f7",
};

// ── API helpers ──

async function apiFetchContest(contestId: string): Promise<Contest | null> {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/contest/${contestId}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            credentials: "include",
        });
        const json = await res.json();
        if (!json.ok || !json.data) return null;
        const c = json.data;
        return {
            id: c.id,
            title: c.title ?? "Untitled Contest",
            description: c.description,
            startTime: c.startTime,
            endTime: c.endTime,
            difficulty: c.difficulty ?? "Intermediate",
            prize: c.prize ?? 0,
            category: c.category ?? "GeneralKnowledge",
            host: c.host,
            tags: Array.isArray(c.tags) ? c.tags : [],
        };
    } catch {
        return null;
    }
}

async function apiFetchLeaderboard(
    contestId: string
): Promise<LeaderboardResponse> {
    const token = localStorage.getItem("token");
    const res = await fetch(
        `${API_BASE}/contest/${contestId}/leaderboard?limit=50`,
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            credentials: "include",
        }
    );
    return res.json();
}

// ── Utility ──

function contestStatus(c: Contest): "live" | "upcoming" | "finished" {
    const now = Date.now();
    const start = new Date(c.startTime).getTime();
    const end = new Date(c.endTime).getTime();
    if (now < start) return "upcoming";
    if (now > end) return "finished";
    return "live";
}

function displayHandle(row: LeaderboardRow): string {
    if (row.isTeam) return row.displayName || "Untitled Squad";
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

// ── Sub-components ──

function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) return <span className="text-lg select-none">🥇</span>;
    if (rank === 2) return <span className="text-lg select-none">🥈</span>;
    if (rank === 3) return <span className="text-lg select-none">🥉</span>;
    return (
        <span className="font-mono text-[0.72rem] text-[var(--text-muted)] w-6 text-center inline-block tabular-nums">
            {rank}
        </span>
    );
}

function Avatar({ row, size = 32 }: { row: LeaderboardRow; size?: number }) {
    const letter = (row.displayName ?? row.email)[0].toUpperCase();
    return (
        <div
            className={`rounded-full flex items-center justify-center font-bold text-black flex-shrink-0 select-none ${row.isTeam ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-primary)]" : ""}`}
            style={{
                width: size,
                height: size,
                background: row.avatarColor,
                fontSize: size * 0.34,
            }}
        >
            {row.isTeam ? "👥" : letter}
        </div>
    );
}

function ScoreBar({ pct, color }: { pct: number; color: string }) {
    return (
        <div className="h-[3px] bg-[var(--border-secondary)] rounded-full overflow-hidden w-full">
            <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{
                    width: `${Math.min(100, Math.max(0, pct))}%`,
                    background: color,
                }}
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
                className={`w-3 h-3 rounded-sm cursor-default border ${isPending ? "animate-pulse" : ""}`}
                style={{
                    background: isUnattempted ? "transparent" : color,
                    borderColor: isUnattempted ? "var(--border-secondary)" : color,
                    opacity: isUnattempted ? 0.4 : 1,
                }}
            />
            {/* Tooltip */}
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md px-3 py-2 shadow-2xl whitespace-nowrap text-left min-w-[160px]">
                    <p className="text-[var(--text-primary)] text-[0.73rem] font-semibold mb-0.5">
                        {cs.title}
                    </p>
                    <p
                        className="text-[0.63rem] mb-1"
                        style={{ color: isUnattempted ? "var(--text-muted)" : color }}
                    >
                        {VERDICT_LABELS[cs.verdict]}
                    </p>
                    {cs.verdict !== "unattempted" && cs.verdict !== "judging" && (
                        <p className="font-mono text-[0.63rem] text-[var(--accent)]">
                            {cs.awarded} / {cs.maxPoints} pts
                        </p>
                    )}
                    {cs.submittedAt && (
                        <p className="font-mono text-[0.58rem] text-[var(--text-muted)] mt-0.5">
                            {relativeTime(cs.submittedAt)}
                        </p>
                    )}
                </div>
                <div className="w-2 h-2 bg-[var(--bg-card)] border-r border-b border-[var(--border-primary)] rotate-45 mx-auto -mt-1" />
            </div>
        </div>
    );
}

function ExpandedPanel({ row }: { row: LeaderboardRow }) {
    return (
        <tr>
            <td colSpan={7} className="px-4 pb-5 pt-1">
                <div className="ml-12 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
                    <p className="font-mono text-[0.58rem] text-[var(--text-muted)] tracking-[2.5px] uppercase mb-3">
                        Challenge breakdown
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {row.challengeScores.map((cs) => {
                            const color = VERDICT_COLORS[cs.verdict];
                            const pct =
                                cs.maxPoints > 0
                                    ? Math.round((cs.awarded / cs.maxPoints) * 100)
                                    : 0;
                            return (
                                <div
                                    key={cs.challengeId}
                                    className="bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-lg p-3"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[var(--text-primary)] text-[0.77rem] font-semibold truncate pr-2">
                                            {cs.title}
                                        </span>
                                        <span
                                            className="font-mono text-[0.67rem] font-bold flex-shrink-0"
                                            style={{
                                                color:
                                                    cs.verdict === "unattempted" ||
                                                        cs.verdict === "judging"
                                                        ? "var(--text-muted)"
                                                        : color,
                                            }}
                                        >
                                            {cs.verdict === "unattempted" || cs.verdict === "judging"
                                                ? "—"
                                                : `${cs.awarded}/${cs.maxPoints}`}
                                        </span>
                                    </div>
                                    <ScoreBar
                                        pct={
                                            cs.verdict === "unattempted" || cs.verdict === "judging"
                                                ? 0
                                                : pct
                                        }
                                        color={color}
                                    />
                                    <div className="flex items-center justify-between mt-1.5">
                                        <span
                                            className="font-mono text-[0.59rem]"
                                            style={{
                                                color: cs.verdict === "unattempted" ? "var(--text-muted)" : color,
                                            }}
                                        >
                                            {VERDICT_LABELS[cs.verdict]}
                                        </span>
                                        {cs.submittedAt && (
                                            <span className="font-mono text-[0.57rem] text-[var(--text-muted)]">
                                                {relativeTime(cs.submittedAt)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Extra info row */}
                    <div className="flex items-center gap-6 mt-3 pt-3 border-t border-[var(--border-secondary)] flex-wrap">
                        <div>
                            <p className="font-mono text-[0.57rem] text-[var(--text-muted)] tracking-widest uppercase">
                                Rating
                            </p>
                            <p className="font-mono text-[0.73rem] text-[var(--accent)] font-bold">
                                {row.rating}
                            </p>
                        </div>
                        {row.firstSolveAt && (
                            <div>
                                <p className="font-mono text-[0.57rem] text-[var(--text-muted)] tracking-widest uppercase">
                                    First solve
                                </p>
                                <p className="font-mono text-[0.73rem] text-[var(--text-primary)]">
                                    {relativeTime(row.firstSolveAt)}
                                </p>
                            </div>
                        )}
                        {row.lastActivityAt && (
                            <div>
                                <p className="font-mono text-[0.57rem] text-[var(--text-muted)] tracking-widest uppercase">
                                    Last activity
                                </p>
                                <p className="font-mono text-[0.73rem] text-[var(--text-primary)]">
                                    {relativeTime(row.lastActivityAt)}
                                </p>
                            </div>
                        )}
                        {row.country && (
                            <div>
                                <p className="font-mono text-[0.57rem] text-[var(--text-muted)] tracking-widest uppercase">
                                    Country
                                </p>
                                <p className="font-mono text-[0.73rem] text-[var(--text-primary)]">
                                    {row.country}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </td>
        </tr>
    );
}

function StatCard({
    label,
    value,
    sub,
    accent,
}: {
    label: string;
    value: string;
    sub?: string;
    accent?: string;
}) {
    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-xl px-5 py-4">
            <p className="font-mono text-[0.57rem] text-[var(--text-muted)] tracking-[2.5px] uppercase mb-2">
                {label}
            </p>
            <p
                className="font-extrabold text-2xl leading-none"
                style={{
                    fontFamily: "var(--font-bebas)",
                    color: accent ?? "var(--text-primary)",
                }}
            >
                {value}
            </p>
            {sub && (
                <p className="font-mono text-[0.6rem] text-[var(--text-muted)] mt-1">{sub}</p>
            )}
        </div>
    );
}

function ScoreDistribution({
    rows,
    maxPossible,
}: {
    rows: LeaderboardRow[];
    maxPossible: number;
}) {
    const buckets = [0, 0, 0, 0, 0];
    rows.forEach((r) => {
        const pct =
            maxPossible > 0
                ? Math.round((r.totalScore / maxPossible) * 100)
                : 0;
        buckets[Math.min(4, Math.floor(pct / 20))]++;
    });
    const maxB = Math.max(...buckets, 1);
    const labels = ["0–20", "20–40", "40–60", "60–80", "80–100"];
    const colors = ["#ef4444", "#f97316", "#f5a623", "#a3e635", "#c8f135"];
    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-xl p-5">
            <p className="font-mono text-[0.57rem] text-[var(--text-muted)] tracking-[2.5px] uppercase mb-4">
                Score distribution %
            </p>
            <div className="flex items-end gap-2 h-20">
                {buckets.map((count, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="font-mono text-[0.58rem] text-[var(--text-muted)]">
                            {count}
                        </span>
                        <div
                            className="w-full rounded-t"
                            style={{
                                height: `${(count / maxB) * 60}px`,
                                background: colors[i],
                                minHeight: count > 0 ? "3px" : "0",
                                transition: "height 0.6s ease-out",
                            }}
                        />
                        <span className="font-mono text-[0.52rem] text-[var(--text-muted)]">
                            {labels[i]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Live solve toast ──

function SolveToast({
    item,
    onExpire,
}: {
    item: ToastItem;
    onExpire: () => void;
}) {
    useEffect(() => {
        const t = setTimeout(onExpire, 5000);
        return () => clearTimeout(t);
    }, [onExpire]);

    const handle = item.displayName ?? item.email.split("@")[0];

    return (
        <div
            className="w-[300px] flex items-stretch gap-0 bg-[var(--bg-card)] border border-[var(--accent)] opacity-25 rounded-xl overflow-hidden shadow-2xl"
            style={{ animation: "toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
            <div className="w-1 bg-[var(--accent)] flex-shrink-0" />
            <div className="flex items-start gap-3 p-3 flex-1">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[0.7rem] font-bold text-black flex-shrink-0"
                    style={{ background: item.avatarColor }}
                >
                    {(item.displayName ?? item.email)[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p className="font-mono text-[0.58rem] text-[var(--accent)] tracking-[2px] uppercase mb-0.5">
                        🔥 Challenge Solved
                    </p>
                    <p className="text-[var(--text-primary)] font-semibold text-[0.8rem] truncate">
                        @{handle}
                    </p>
                    <p className="font-mono text-[0.67rem] text-[var(--text-muted)] truncate">
                        {item.challengeTitle}
                    </p>
                    <p className="font-mono text-[0.67rem] text-[var(--accent)] font-bold mt-0.5">
                        +{item.points} pts
                    </p>
                </div>
            </div>
        </div>
    );
}

// ── Main page ──

export default function ContestLeaderboardPage() {
    const params = useParams();
    const contestId = params.contestid as string;

    const [contest, setContest] = useState<Contest | null>(null);
    const [data, setData] = useState<LeaderboardResponse | null>(null);
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const [sortBy, setSortBy] = useState<"score" | "firstSolve">("score");

    const seenSolves = useRef(new Set<string>());

    const status = contest ? contestStatus(contest) : null;

    // Load contest info once
    useEffect(() => {
        if (!contestId) return;
        apiFetchContest(contestId)
            .then((c) => {
                if (c) setContest(c);
                else setError("Contest not found");
            })
            .catch(() => setError("Failed to load contest"));
    }, [contestId]);

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

                // Fire toasts for any new solve in the last 60 s
                for (const solve of res.recentSolves) {
                    const key = `${solve.userId}:${solve.challengeTitle}:${solve.solvedAt.slice(0, 16)}`;
                    if (!seenSolves.current.has(key)) {
                        seenSolves.current.add(key);
                        setToasts((prev) => [
                            ...prev.slice(-4),
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
        [contestId]
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
                return (
                    new Date(a.firstSolveAt).getTime() -
                    new Date(b.firstSolveAt).getTime()
                );
            }
            return a.rank - b.rank;
        })
        : [];

    const diffColor = contest
        ? (DIFFICULTY_COLOR[contest.difficulty] ?? "#888")
        : "#888";

    return (
        <div
            className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-syne)" }}
        >
            {/* Toast stack */}
            <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 items-end">
                {toasts.map((t) => (
                    <SolveToast
                        key={t.id}
                        item={t}
                        onExpire={() => dismissToast(t.id)}
                    />
                ))}
            </div>

            {/* ── Header ── */}
            <header className="sticky top-0 z-50 border-b border-[var(--border-primary)] bg-[var(--bg-primary)] opacity-90 backdrop-blur-md px-6 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="font-extrabold text-[1.35rem] tracking-[4px] text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors no-underline"
                        style={{ fontFamily: "var(--font-bebas)" }}
                    >
                        Arena<span className="text-[var(--accent)]">X</span>
                    </Link>
                    <span className="text-[var(--border-secondary)] hidden md:inline">|</span>
                    <span className="font-mono text-[0.65rem] text-[var(--text-muted)] hidden md:inline tracking-widest uppercase">
                        Leaderboard
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {status === "live" && (
                        <span className="flex items-center gap-1.5 font-mono text-[0.62rem] text-[var(--accent)] bg-[var(--accent-bg)] border border-[var(--accent-border)] px-2.5 py-1 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-ping" />
                            Live
                        </span>
                    )}
                    <span className="font-mono text-[0.6rem] text-[var(--text-muted)] hidden sm:block tabular-nums">
                        {lastUpdate.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        })}
                    </span>
                    <Link
                        href="/contests"
                        className="font-mono text-[0.62rem] text-[var(--text-muted)] border border-[var(--border-secondary)] px-3 py-1.5 rounded-lg hover:border-[var(--accent-border)] hover:text-[var(--accent)] transition-colors no-underline"
                    >
                        ← Contests
                    </Link>
                </div>
            </header>

            <div className="max-w-[1280px] mx-auto px-6 py-8 space-y-7">
                {/* Error banner */}
                {error && (
                    <div className="bg-red-500/8 border border-red-500/25 rounded-xl px-5 py-3.5 font-mono text-[0.72rem] text-red-400 flex items-center justify-between">
                        <span>{error}</span>
                        <button
                            onClick={() => load(false)}
                            className="underline hover:text-red-300"
                        >
                            retry
                        </button>
                    </div>
                )}

                {/* Contest title */}
                {contest && (
                    <div className="flex items-start justify-between gap-6 flex-wrap">
                        <div>
                            <h1
                                className="font-extrabold leading-none mb-2 text-[var(--text-primary)]"
                                style={{
                                    fontFamily: "var(--font-bebas)",
                                    fontSize: "clamp(2.2rem, 5vw, 4rem)",
                                }}
                            >
                                {contest.title}
                            </h1>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <span
                                    className={`font-mono text-[0.62rem] tracking-[2px] uppercase px-2.5 py-1 rounded-md border ${status === "live"
                                        ? "text-[var(--accent)] border-[var(--accent-border)] bg-[var(--accent-bg)]"
                                        : status === "upcoming"
                                            ? "text-orange-400 border-orange-400/25 bg-orange-400/8"
                                            : "text-[var(--text-muted)] border-[var(--border-secondary)] bg-[var(--bg-card)]"
                                        }`}
                                >
                                    {status === "live"
                                        ? "● Live"
                                        : status === "upcoming"
                                            ? "◷ Upcoming"
                                            : "✓ Ended"}
                                </span>
                                <span
                                    className="font-mono text-[0.62rem] px-2 py-0.5 rounded border"
                                    style={{
                                        color: diffColor,
                                        borderColor: `${diffColor}33`,
                                        background: `${diffColor}11`,
                                    }}
                                >
                                    {contest.difficulty}
                                </span>
                                {contest.prize > 0 && (
                                    <span className="font-mono text-[0.62rem] text-[var(--accent)] font-bold">
                                        ${contest.prize.toLocaleString()} prize
                                    </span>
                                )}
                                {contest.host && (
                                    <span className="font-mono text-[0.62rem] text-[var(--text-muted)]">
                                        by {contest.host}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats */}
                {data && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        <StatCard
                            label="Participants"
                            value={data.stats.totalParticipants.toString()}
                            sub="on leaderboard"
                        />
                        <StatCard
                            label="Avg Score"
                            value={`${data.stats.avgScorePct}%`}
                            sub="of max possible"
                            accent="var(--accent)"
                        />
                        <StatCard
                            label="Top Score"
                            value={data.stats.topScore.toString()}
                            sub={`of ${data.stats.maxPossible} pts`}
                            accent="var(--accent)"
                        />
                        <StatCard
                            label="Full Solves"
                            value={data.stats.fullSolveCount.toString()}
                            sub="got ≥1 full mark"
                        />
                        <StatCard
                            label="Prize Pool"
                            value={
                                contest?.prize
                                    ? `$${contest.prize.toLocaleString()}`
                                    : "—"
                            }
                            sub={contest?.difficulty}
                        />
                    </div>
                )}

                {/* Distribution */}
                {data && data.leaderboard.length > 0 && (
                    <ScoreDistribution
                        rows={data.leaderboard}
                        maxPossible={data.stats.maxPossible}
                    />
                )}

                {/* Challenge key */}
                {data && data.challenges.length > 0 && (
                    <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-mono text-[0.57rem] text-[var(--text-muted)] tracking-[2.5px] uppercase">
                            Challenges:
                        </p>
                        {data.challenges.map((ch, i) => (
                            <div key={ch.id} className="flex items-center gap-1.5">
                                <span className="font-mono text-[0.58rem] text-[var(--accent)] bg-[var(--accent-bg)] border border-[var(--accent-border)] rounded px-1.5 py-0.5">
                                    C{i + 1}
                                </span>
                                <span className="font-mono text-[0.6rem] text-[var(--text-muted)]">
                                    {ch.title}
                                </span>
                                <span className="font-mono text-[0.55rem] text-[var(--text-muted)] opacity-50">
                                    ({ch.maxPoints}p)
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Sort controls */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <p className="font-mono text-[0.62rem] text-[var(--text-muted)] tracking-[2px] uppercase">
                        {rows.length} participants ranked
                    </p>
                    <div className="flex gap-1.5">
                        {(["score", "firstSolve"] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setSortBy(s)}
                                className={`font-mono text-[0.6rem] tracking-[1.5px] uppercase px-3 py-1.5 rounded-lg border transition-all ${sortBy === s
                                    ? "bg-[var(--accent)] text-[var(--accent-text-on)] border-[var(--accent)]"
                                    : "text-[var(--text-muted)] border-[var(--border-secondary)] hover:border-[var(--border-primary)] hover:text-[var(--text-primary)]"
                                    }`}
                            >
                                {s === "score" ? "By Score" : "By Speed"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="border border-[var(--border-primary)] rounded-2xl overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
                                {[
                                    "#",
                                    "Participant",
                                    "Challenges",
                                    "Score",
                                    "Rating",
                                    "Activity",
                                    "",
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className="font-mono text-[0.57rem] text-[var(--text-muted)] tracking-[2.5px] uppercase text-left px-4 py-3 whitespace-nowrap"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)] opacity-30 border-t-[var(--accent)] animate-spin" />
                                            <span className="font-mono text-[0.7rem] text-[var(--text-muted)]">
                                                Loading leaderboard…
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-16 text-center">
                                        <p className="font-mono text-[0.7rem] text-[var(--text-muted)]">
                                            No submissions yet.
                                        </p>
                                        <p className="font-mono text-[0.62rem] text-[var(--text-muted)] opacity-70 mt-1">
                                            Be the first to submit!
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => {
                                    const isExpanded = expandedUserId === row.userId;
                                    const scoreColor =
                                        row.scorePct >= 85
                                            ? "var(--accent)"
                                            : row.scorePct >= 50
                                                ? "#f5a623"
                                                : "#ef4444";

                                    return (
                                        <>
                                            <tr
                                                key={row.userId}
                                                onClick={() =>
                                                    setExpandedUserId(
                                                        isExpanded ? null : row.userId
                                                    )
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        setExpandedUserId(isExpanded ? null : row.userId);
                                                    }
                                                }}
                                                className={`border-b border-[var(--border-secondary)] cursor-pointer transition-colors duration-100 group ${isExpanded
                                                    ? "bg-[var(--bg-card-hover)]"
                                                    : "hover:bg-[var(--bg-card)]"
                                                    }`}
                                            >
                                                {/* Rank */}
                                                <td className="px-4 py-3.5 w-10">
                                                    <RankBadge rank={row.rank} />
                                                </td>

                                                {/* Participant */}
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar row={row} />
                                                        <div className="min-w-0">
                                                            <p className="text-[0.85rem] font-semibold text-[var(--text-primary)] truncate">
                                                                {displayHandle(row)}
                                                                {row.country && (
                                                                    <span className="ml-1.5 text-[0.7rem] text-[var(--text-muted)]">
                                                                        {row.country}
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <p className="font-mono text-[0.62rem] text-[var(--text-muted)] truncate">
                                                                {row.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Challenge pips */}
                                                <td className="px-4 py-3.5">
                                                    <div className="flex gap-1.5 items-center flex-wrap">
                                                        {row.challengeScores.map((cs) => (
                                                            <VerdictPip
                                                                key={cs.challengeId}
                                                                cs={cs}
                                                            />
                                                        ))}
                                                    </div>
                                                    <p className="font-mono text-[0.57rem] text-[var(--text-muted)] mt-1">
                                                        {
                                                            row.challengeScores.filter(
                                                                (c) =>
                                                                    c.verdict === "full" ||
                                                                    c.verdict === "partial"
                                                            ).length
                                                        }
                                                        /{row.challengeScores.length} attempted
                                                    </p>
                                                </td>

                                                {/* Score */}
                                                <td className="px-4 py-3.5 min-w-[130px]">
                                                    <div className="flex items-baseline justify-between mb-1">
                                                        <span
                                                            className="font-mono font-bold text-[0.82rem]"
                                                            style={{ color: scoreColor }}
                                                        >
                                                            {row.totalScore}
                                                        </span>
                                                        <span className="font-mono text-[0.6rem] text-[var(--text-muted)]">
                                                            /{row.maxPossible}
                                                        </span>
                                                    </div>
                                                    <ScoreBar
                                                        pct={row.scorePct}
                                                        color={scoreColor}
                                                    />
                                                    <p
                                                        className="font-mono text-[0.57rem] mt-1"
                                                        style={{ color: scoreColor }}
                                                    >
                                                        {row.scorePct}%
                                                    </p>
                                                </td>

                                                {/* Rating */}
                                                <td className="px-4 py-3.5 hidden md:table-cell">
                                                    <span className="font-mono text-[0.75rem] text-[var(--accent)] font-bold">
                                                        {row.rating}
                                                    </span>
                                                </td>

                                                {/* Last activity */}
                                                <td className="px-4 py-3.5 hidden lg:table-cell">
                                                    <span className="font-mono text-[0.65rem] text-[var(--text-muted)]">
                                                        {row.lastActivityAt
                                                            ? relativeTime(row.lastActivityAt)
                                                            : "—"}
                                                    </span>
                                                </td>

                                                {/* Expand chevron */}
                                                <td className="px-4 py-3.5">
                                                    <span
                                                        className={`inline-block font-mono text-[0.58rem] text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-all duration-200 ${isExpanded ? "rotate-180" : ""
                                                            }`}
                                                    >
                                                        ▼
                                                    </span>
                                                </td>
                                            </tr>

                                            {isExpanded && (
                                                <ExpandedPanel
                                                    key={`${row.userId}-panel`}
                                                    row={row}
                                                />
                                            )}
                                        </>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 flex-wrap pb-8">
                    <p className="font-mono text-[0.57rem] text-[var(--text-muted)] tracking-[2px] uppercase">
                        Legend:
                    </p>
                    {(
                        Object.entries(VERDICT_LABELS) as [Verdict, string][]
                    ).map(([v, label]) => (
                        <div key={v} className="flex items-center gap-1.5">
                            <div
                                className={`w-3 h-3 rounded-sm border ${v === "judging" ? "animate-pulse" : ""}`}
                                style={{
                                    background:
                                        v === "unattempted" ? "transparent" : VERDICT_COLORS[v],
                                    borderColor:
                                        v === "unattempted" ? "var(--border-secondary)" : VERDICT_COLORS[v],
                                    opacity: v === "unattempted" ? 0.4 : 1,
                                }}
                            />
                            <span className="font-mono text-[0.6rem] text-[var(--text-muted)]">
                                {label}
                            </span>
                        </div>
                    ))}
                    <p className="font-mono text-[0.57rem] text-[var(--text-muted)] opacity-50 ml-auto">
                        Hover pips for details · Click rows to expand
                    </p>
                </div>
            </div>

            <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(1.5rem) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
        </div>
    );
}
