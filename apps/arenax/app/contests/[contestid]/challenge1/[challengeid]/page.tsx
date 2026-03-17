"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { BACKEND_URL as API_BASE } from "@/config";
interface Challenge {
    id: string;
    title: string;
    description: string;
    question: string;
    hint: string;
    maxPoints: number;
    duration: number;
    type: string;
}

interface Contest {
    id: string;
    title: string;
    challenges: Challenge[];
    participationMode: "Solo" | "Team";
    registeredTeamId?: string;
}

interface ScoreDimension {
    label: string;
    score: number;
    max: number;
    comment: string;
}

interface ScoreResult {
    score: number;
    pointsAwarded: number;
    maxPoints: number;
    verdict: "full" | "partial" | "zero";
    summary: string;
    breakdown: ScoreDimension[];
    mistakes: string[];
    strengths: string[];
    modelAnswer: string;
}

type ScoringState = "idle" | "submitted" | "polling" | "done" | "error";

interface SubmissionState {
    answer: string;
    scoring: ScoringState;
    result: ScoreResult | null;
    error: string | null;
}

//API helpers

async function fetchContestWithChallenges(contestId: string): Promise<Contest | null> {
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
        const challenges = (c.contestToChallengeMapping || [])
            .sort((a: any, b: any) => a.index - b.index)
            .map((m: any) => ({
                id: m.challenge.id,
                title: m.challenge.title,
                description: m.challenge.description || "",
                question: m.challenge.question || "",
                hint: m.challenge.hint || "",
                maxPoints: m.challenge.maxPoints || 0,
                duration: m.challenge.duration || 0,
                type: m.challenge.type || "Unknown",
            }));

        return { 
            id: c.id, 
            title: c.title, 
            challenges,
            participationMode: c.participationMode || "Solo",
            registeredTeamId: json.data.registeredTeamId
        };
    } catch (e) {
        console.error("Error fetching contest:", e);
        return null;
    }
}

async function submitAnswer(
    contestId: string,
    challengeId: string,
    submission: string,
    teamId?: string
): Promise<{ ok: boolean; message?: string }> {
    try {
        const aiApiKey = localStorage.getItem("aiApiKey") || "";
        const token = localStorage.getItem("token");
        const res = await fetch(
            `${API_BASE}/contest/${contestId}/challenge/${challengeId}/submit`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ submission, aiApiKey, teamId }),
            }
        );
        return await res.json();
    } catch (e) {
        return { ok: false, message: "Network error" };
    }
}

async function fetchSubmissionResult(
    contestId: string,
    challengeId: string
): Promise<ScoreResult | null> {
    try {
        const token = localStorage.getItem("token");

        const res = await fetch(
            `${API_BASE}/contest/${contestId}/challenge/${challengeId}/result`,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
            }
        );

        if (!res.ok) return null;

        const json = await res.json();
        if (!json.ok || !json.data) return null;

        const s = json.data;

        // ⏳ Still judging → keep polling
        if (s.status === "Pending" || s.status === "Judging") {
            return null;
        }

        // VERY IMPORTANT: Map backend verdict → UI verdict
        let mappedVerdict: "full" | "partial" | "zero" = "zero";

        if (s.aiVerdict === "Correct") {
            mappedVerdict = "full";
        } else if (s.aiVerdict === "Partially Correct") {
            mappedVerdict = "partial";
        } else if (s.aiVerdict === "Wrong") {
            mappedVerdict = "zero";
        } else {
            // fallback (if AI fails)
            mappedVerdict =
                s.score >= 85 ? "full" : s.score >= 20 ? "partial" : "zero";
        }

        return {
            score: s.score ?? 0,
            pointsAwarded: s.score ?? 0,
            maxPoints: s.maxPoints ?? 0,
            verdict: mappedVerdict,
            summary: s.aiReason ?? "Judging complete.",
            breakdown: [],
            strengths: [],
            mistakes: [],
            modelAnswer: "",
        };
    } catch (e) {
        console.error("Error fetching result:", e);
        return null;
    }
}

// Sub-components
function ScoreBar({ score, max, color }: { score: number; max: number; color: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-[var(--border-secondary)] rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(score / max) * 100}%`, background: color }}
                />
            </div>
            <span className="font-mono text-[0.72rem] text-[var(--text-muted)] w-8 text-right">
                {score}/{max}
            </span>
        </div>
    );
}

function HintBlock({ hint }: { hint: string }) {
    const [open, setOpen] = useState(false);
    if (!hint) return null;
    return (
        <div className="mt-5 border border-[var(--border-secondary)] rounded-lg overflow-hidden">
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-card-hover)] transition-colors text-left"
            >
                <span className="font-mono text-[0.65rem] text-[var(--text-muted)] tracking-[2px] uppercase flex items-center gap-2">
                    <span className="text-[var(--accent)]">💡</span> Show Hint
                </span>
                <span className={`text-[var(--text-muted)] text-xs transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
                    ▼
                </span>
            </button>
            {open && (
                <div className="px-4 pb-4 pt-2 font-mono text-[0.78rem] text-[var(--text-muted)] leading-[1.6] border-t border-[var(--border-primary)] bg-[var(--bg-card)]">
                    {hint}
                </div>
            )}
        </div>
    );
}

function LoadingState({ scoringState }: { scoringState: ScoringState }) {
    const steps = [
        { key: "submitted", label: "Answer submitted to server…" },
        { key: "polling", label: "AI judge is evaluating…" },
        { key: "polling", label: "Calculating partial credit…" },
        { key: "polling", label: "Generating feedback…" },
        { key: "polling", label: "Almost done…" },
    ];

    const [step, setStep] = useState(0);

    useEffect(() => {

        const id = setInterval(
            () => setStep((s) => Math.min(s + 1, steps.length - 1)),
            1500
        );
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (scoringState === "submitted") setStep(0);
        if (scoringState === "polling") setStep(1);
    }, [scoringState]);

    return (
        <div className="flex flex-col items-center justify-center h-full gap-6 px-8">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-[var(--accent)] opacity-20" />
                <div className="absolute inset-0 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-[var(--accent)] text-xl">⚡</div>
            </div>

            <div className="text-center">
                <p className="text-[var(--text-primary)] font-semibold text-sm mb-2 transition-all duration-500">
                    {steps[step].label}
                </p>
                <p className="font-mono text-[0.62rem] text-[var(--text-muted)] tracking-widest uppercase">
                    Backend judging in progress
                </p>
            </div>

            {/* Dot progress */}
            <div className="flex gap-1.5">
                {steps.map((_, i) => (
                    <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i <= step ? "bg-[var(--accent)]" : "bg-[var(--border-secondary)]"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}

function ScoringResults({
    result,
    hasNext,
    onNext,
}: {
    result: ScoreResult;
    hasNext: boolean;
    onNext: () => void;
}) {
    const verdictCfg = {
        full: { bg: "bg-[var(--accent)] opacity-10 border-[var(--accent)] opacity-30", bgActual: "bg-[var(--accent-bg)] border-[var(--accent-border)]", text: "text-[var(--accent)]", icon: "🏆", label: "Full Marks" },
        partial: { bg: "bg-amber-400/10 border-amber-400/25", bgActual: "bg-amber-400/10 border-amber-400/25", text: "text-amber-400", icon: "⚡", label: "Partial Credit" },
        zero: { bg: "bg-red-500/10 border-red-500/20", bgActual: "bg-red-500/10 border-red-500/20", text: "text-red-400", icon: "✗", label: "No Marks" },
    }[result.verdict];

    const [modelOpen, setModelOpen] = useState(false);

    return (
        <div className="h-full overflow-y-auto px-6 py-6 space-y-5 scrollbar-thin">
            {/* Verdict banner */}
            <div className={`rounded-xl border px-5 py-4 ${verdictCfg.bgActual} flex items-center justify-between gap-4`}>
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{verdictCfg.icon}</span>
                    <div>
                        <div className={`font-extrabold text-base ${verdictCfg.text}`}>{verdictCfg.label}</div>
                        <div className="text-[var(--text-primary)] opacity-60 text-[0.8rem] mt-0.5">{result.summary}</div>
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <div
                        className={`font-extrabold leading-none ${verdictCfg.text}`}
                        style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "2.8rem" }}
                    >
                        {result.pointsAwarded}
                        <span className="text-xl text-[var(--text-muted)]">/{result.maxPoints}</span>
                    </div>
                    <div className="font-mono text-[0.6rem] text-[var(--text-muted)] tracking-widest uppercase mt-0.5">Points</div>
                </div>
            </div>

            {/* Score circle */}
            <div className="flex items-center gap-5 bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-xl p-4">
                <div className="relative w-[72px] h-[72px] flex-shrink-0">
                    <svg width="72" height="72" className="-rotate-90">
                        <circle cx="36" cy="36" r="30" fill="none" stroke="var(--border-primary)" strokeWidth="5" />
                        <circle
                            cx="36" cy="36" r="30" fill="none"
                            stroke={result.score >= 85 ? "var(--accent)" : result.score >= 50 ? "#f5a623" : "#ef4444"}
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={`${(result.score / 100) * 188.5} 188.5`}
                            className="transition-all duration-1000"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-mono font-bold text-[var(--text-primary)] text-base">{result.score}%</span>
                    </div>
                </div>
                <div>
                    <div className="text-[var(--text-primary)] font-bold text-sm mb-1">Overall Score</div>
                    <div className="text-[var(--text-muted)] text-[0.78rem] leading-[1.5]">
                        Scored across {result.breakdown.length} dimensions. Partial credit applied where applicable.
                    </div>
                </div>
            </div>

            {/* Breakdown */}
            {result.breakdown.length > 0 && (
                <div>
                    <div className="font-mono text-[0.6rem] text-[var(--text-muted)] tracking-[2px] uppercase mb-3">Score Breakdown</div>
                    <div className="space-y-3">
                        {result.breakdown.map((dim) => {
                            const pct = dim.score / dim.max;
                            const color = pct >= 0.85 ? "var(--accent)" : pct >= 0.5 ? "#f5a623" : "#ef4444";
                            return (
                                <div key={dim.label} className="bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-[var(--text-primary)] text-[0.85rem]">{dim.label}</span>
                                        <span className="font-mono text-[0.72rem] font-bold" style={{ color }}>
                                            {dim.score}/{dim.max}
                                        </span>
                                    </div>
                                    <ScoreBar score={dim.score} max={dim.max} color={color} />
                                    <p className="text-[var(--text-muted)] text-[0.76rem] leading-[1.6] mt-2.5">{dim.comment}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Strengths */}
            {result.strengths.length > 0 && (
                <div className="rounded-lg border border-[var(--accent-border)] bg-[var(--accent-bg)] p-4">
                    <div className="font-mono text-[0.6rem] tracking-[2px] uppercase text-[var(--accent)] mb-3">✓ What You Did Well</div>
                    <ul className="space-y-2">
                        {result.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-[0.8rem] text-[var(--text-primary)] opacity-80 leading-[1.5]">
                                <span className="text-[var(--accent)] font-bold mt-0.5 flex-shrink-0">✓</span>
                                {s}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Mistakes */}
            {result.mistakes.length > 0 && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/[0.04] p-4">
                    <div className="font-mono text-[0.6rem] tracking-[2px] uppercase text-red-400 mb-3">✗ Errors & Gaps Found</div>
                    <ul className="space-y-2">
                        {result.mistakes.map((m, i) => (
                            <li key={i} className="flex items-start gap-2 text-[0.8rem] text-[var(--text-primary)] opacity-80 leading-[1.5]">
                                <span className="text-red-400 font-bold mt-0.5 flex-shrink-0">✗</span>
                                {m}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Model answer */}
            {result.modelAnswer && (
                <div className="border border-[var(--border-secondary)] rounded-lg overflow-hidden">
                    <button
                        onClick={() => setModelOpen((o) => !o)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--bg-card-hover)] transition-colors text-left"
                    >
                        <span className="font-mono text-[0.65rem] tracking-[2px] uppercase text-[var(--text-muted)] flex items-center gap-2">
                            <span className="text-[var(--accent)]">📖</span> What a Full-Mark Answer Looks Like
                        </span>
                        <span className={`text-[var(--text-muted)] text-xs transition-transform duration-200 ${modelOpen ? "rotate-180" : ""}`}>
                            ▼
                        </span>
                    </button>
                    {modelOpen && (
                        <div className="px-5 pb-5 pt-2 border-t border-[var(--border-primary)] bg-[var(--bg-card)]">
                            <p className="text-[var(--text-primary)] opacity-80 text-[0.83rem] leading-[1.75] whitespace-pre-line">
                                {result.modelAnswer}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Next CTA */}
            <div className="pt-2 pb-6">
                <button
                    onClick={onNext}
                    className="w-full bg-[var(--accent)] text-[var(--accent-text-on)] font-extrabold text-[0.85rem] tracking-[2px] uppercase py-4 rounded-lg hover:opacity-90 hover:-translate-y-0.5 transition-all duration-150 shadow-[0_6px_20px_rgba(200,241,53,0.2)]"
                >
                    {hasNext ? "Next Challenge →" : "View Leaderboard →"}
                </button>
            </div>
        </div>
    );
}

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 120_000;

export default function ChallengePage() {
    const params = useParams();
    const router = useRouter();
    const contestId = params.contestid as string;
    const challengeId = params.challengeid as string;

    const [contest, setContest] = useState<Contest | null>(null);
    const [loading, setLoading] = useState(true);
    const [answer, setAnswer] = useState("");
    const [submission, setSubmission] = useState<SubmissionState>({
        answer: "",
        scoring: "idle",
        result: null,
        error: null,
    });

    // Theme
    const { theme, toggleTheme } = useTheme();

    // API key
    const [apiKey, setApiKey] = useState("");
    const [showApiInput, setShowApiInput] = useState(false);
    useEffect(() => {
        const saved = localStorage.getItem("aiApiKey");
        if (saved) setApiKey(saved);
    }, []);
    const handleApiKeyChange = (val: string) => {
        setApiKey(val);
        localStorage.setItem("aiApiKey", val);
    };

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pollStartRef = useRef<number>(0);

    // ── fetch contest once ──
    useEffect(() => {
        fetchContestWithChallenges(contestId).then((data) => {
            setContest(data);
            setLoading(false);
        });
    }, [contestId]);

    // ── reset when challenge changes ──
    useEffect(() => {
        stopPolling();
        setSubmission({ answer: "", scoring: "idle", result: null, error: null });
        setAnswer("");
        setTimeout(() => textareaRef.current?.focus(), 100);
    }, [challengeId]);

    // ── cleanup on unmount ──
    useEffect(() => () => stopPolling(), []);

    const stopPolling = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);


    const startPolling = useCallback(() => {
        pollStartRef.current = Date.now();

        pollRef.current = setInterval(async () => {
            if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
                stopPolling();
                setSubmission((prev) => ({
                    ...prev,
                    scoring: "error",
                    error: "Judging timed out. Please try again.",
                }));
                return;
            }

            const result = await fetchSubmissionResult(contestId, challengeId);

            if (result) {
                stopPolling();
                setSubmission((prev) => ({ ...prev, scoring: "done", result }));
            }
        }, POLL_INTERVAL_MS);
    }, [contestId, challengeId, stopPolling]);

    const handleSubmit = async () => {
        if (!answer.trim()) return;

        setSubmission({ answer, scoring: "submitted", result: null, error: null });

        const submitResult = await submitAnswer(contestId, challengeId, answer, contest?.registeredTeamId);

        if (!submitResult.ok) {
            setSubmission({
                answer,
                scoring: "error",
                result: null,
                error: submitResult.message || "Submission failed",
            });
            return;
        }

        setSubmission((prev) => ({ ...prev, scoring: "polling" }));
        startPolling();
    };

    const handleNext = () => {
        if (!contest) return;
        const idx = contest.challenges.findIndex((ch) => ch.id === challengeId);
        const next = contest.challenges[idx + 1];
        if (next) {
            router.push(`/contests/${contest.id}/challenge1/${next.id}`);
        } else {
            router.push(`/contests/${contestId}/leaderboard`);
        }
    };

    const challengeIndex = contest
        ? contest.challenges.findIndex((ch) => ch.id === challengeId)
        : -1;
    const challenge = contest?.challenges[challengeIndex];
    const hasNext = !!contest && challengeIndex < contest.challenges.length - 1;
    const isSubmitted = submission.scoring !== "idle";

    // ── render guards ──
    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="text-[var(--accent)] text-xl font-mono">Loading challenge...</div>
            </div>
        );
    }

    if (!contest || !challenge || challengeIndex === -1) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-4 text-[var(--text-primary)]">
                <div className="text-5xl font-extrabold" style={{ fontFamily: "'Bebas Neue', cursive" }}>
                    Not Found
                </div>
                <Link href="/contests" className="text-[var(--accent)] font-mono text-sm hover:underline no-underline">
                    ← Back to Contests
                </Link>
            </div>
        );
    }

    return (
        <div
            className="h-screen flex flex-col overflow-hidden"
            style={{ fontFamily: "'Syne', sans-serif", background: "var(--bg-primary)", color: "var(--text-primary)" }}
        >
            {/* ── Top bar ── */}
            <header className="h-12 flex items-center justify-between px-5 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-primary)", background: "var(--header-bg)", backdropFilter: "blur(8px)" }}>
                <div className="flex items-center gap-2 font-mono text-[0.7rem] min-w-0" style={{ color: "var(--text-muted)" }}>
                    <Link href="/contests" className="hover:opacity-80 transition-colors no-underline flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                        Contests
                    </Link>
                    <span style={{ color: "var(--text-dimmer)" }}>/</span>
                    <span className="truncate hidden sm:block" style={{ color: "var(--text-secondary)" }}>{contest.title}</span>
                    <span className="hidden sm:block" style={{ color: "var(--text-dimmer)" }}>/</span>
                    <span className="truncate" style={{ color: "var(--accent)" }}>{challenge.title}</span>
                </div>

                {/* Progress dots */}
                <div className="flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
                    {contest.challenges.map((_, i) => (
                        <div
                            key={i}
                            className="rounded-full transition-all duration-300"
                            style={{
                                width: i === challengeIndex ? 10 : 8,
                                height: i === challengeIndex ? 10 : 8,
                                background: i < challengeIndex ? "var(--accent)" : i === challengeIndex ? "var(--accent)" : "var(--border-primary)",
                                opacity: i < challengeIndex ? 0.6 : 1,
                            }}
                        />
                    ))}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all hover:opacity-80"
                        style={{ background: "var(--bg-card)", border: "1px solid var(--border-secondary)" }}
                        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    >
                        {theme === "dark" ? "☀" : "🌙"}
                    </button>

                    {/* API key toggle */}
                    <button
                        onClick={() => setShowApiInput(!showApiInput)}
                        className="font-mono text-[0.6rem] px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                        style={{
                            background: apiKey ? "var(--accent-bg)" : "var(--bg-card)",
                            border: `1px solid ${apiKey ? "var(--accent-border)" : "var(--border-secondary)"}`,
                            color: apiKey ? "var(--accent)" : "var(--text-muted)",
                        }}
                        title="Set Gemini API key"
                    >
                        🔑 {apiKey ? "Key Set" : "API Key"}
                    </button>

                    <span className="font-mono text-[0.68rem]" style={{ color: "var(--text-muted)" }}>
                        <span className="font-bold" style={{ color: "var(--text-primary)" }}>{challengeIndex + 1}</span>
                        <span style={{ color: "var(--text-dimmer)" }}> / </span>
                        {contest.challenges.length}
                    </span>
                    <Link
                        href={`/contests/${contestId}/leaderboard`}
                        className="font-mono text-[0.62rem] px-2.5 py-1 rounded transition-colors no-underline hidden sm:flex items-center gap-1.5"
                        style={{ color: "var(--text-muted)", border: "1px solid var(--border-secondary)" }}
                    >
                        🏆 Leaderboard
                    </Link>
                </div>
            </header>

            {/* ── API Key Input Panel ── */}
            {showApiInput && (
                <div className="px-5 py-3 flex items-center gap-3" style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-primary)" }}>
                    <span className="font-mono text-[0.62rem] tracking-[1.5px] uppercase flex-shrink-0" style={{ color: "var(--text-muted)" }}>🔑 Gemini API Key</span>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => handleApiKeyChange(e.target.value)}
                        placeholder="Paste your Gemini API key (AIza...)"
                        className="flex-1 h-8 rounded-lg px-3 text-[0.78rem] font-mono outline-none transition-all"
                        style={{
                            background: "var(--input-bg)",
                            border: "1px solid var(--border-secondary)",
                            color: "var(--text-primary)",
                        }}
                    />
                    <button
                        onClick={() => setShowApiInput(false)}
                        className="font-mono text-[0.62rem] px-3 py-1.5 rounded-lg transition-all"
                        style={{ background: "var(--accent)", color: "var(--accent-text-on)", fontWeight: 700 }}
                    >
                        Save
                    </button>
                </div>
            )}

            {/* ── Split screen ── */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
                {/* LEFT: Question + Answer */}
                <div className="flex flex-col border-r border-[var(--border-primary)] overflow-hidden">
                    {/* Question (scrollable) */}
                    <div className="flex-1 overflow-y-auto px-7 py-6 scrollbar-thin min-h-0">
                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                            <span className="font-mono text-[0.6rem] tracking-[2px] uppercase text-[var(--accent)] bg-[var(--accent-bg)] border border-[var(--accent-border)] px-2 py-0.5 rounded-sm">
                                Challenge {challengeIndex + 1}
                            </span>
                             <span className="font-mono text-[0.6rem] tracking-widest uppercase text-[var(--text-muted)] border border-[var(--border-secondary)] px-2 py-0.5 rounded-sm">
                                {challenge.type}
                            </span>
                            {contest.participationMode === "Team" && (
                                <span className="font-mono text-[0.6rem] tracking-widest uppercase text-[var(--accent)] bg-[var(--accent-bg)] border border-[var(--accent-border)] px-2 py-0.5 rounded-sm">
                                    SQUAD MODE
                                </span>
                            )}
                            <span className="font-mono text-[0.65rem] font-bold text-[var(--accent)] ml-auto">
                                +{challenge.maxPoints} pts
                            </span>
                        </div>

                        <h2 className="text-[var(--text-primary)] font-extrabold text-xl leading-tight mb-5">
                            {challenge.title}
                        </h2>

                        <div className="font-mono text-[0.6rem] text-[var(--text-muted)] tracking-[2px] uppercase mb-3 flex items-center gap-2">
                            <span className="w-0.5 h-3 bg-[var(--accent)] rounded-full" />
                            Question
                        </div>

                        <div className="text-[var(--text-primary)] text-[0.93rem] leading-[1.8] whitespace-pre-line">
                            {challenge.question}
                        </div>

                        {challenge.hint && <HintBlock hint={challenge.hint} />}
                    </div>

                    {/* Answer area */}
                    <div className="border-t border-[var(--border-primary)] flex-shrink-0 bg-[var(--bg-secondary)] px-6 pt-4 pb-5">
                        <div className="font-mono text-[0.6rem] text-[var(--text-muted)] tracking-[2px] uppercase mb-2 flex items-center gap-2">
                            <span className="w-0.5 h-3 bg-[var(--border-secondary)] rounded-full" />
                            {isSubmitted ? (
                                <span className="text-[var(--accent)] opacity-70">✓ Answer submitted — judging in progress</span>
                            ) : (
                                "Your Answer"
                            )}
                        </div>
                        <textarea
                            ref={textareaRef}
                            value={answer}
                            onChange={(e) => !isSubmitted && setAnswer(e.target.value)}
                            onKeyDown={(e) => {
                                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSubmit();
                            }}
                            disabled={isSubmitted}
                            rows={6}
                            placeholder={isSubmitted ? "" : "Type your answer… (Ctrl+Enter to submit)"}
                            className={`w-full resize-none rounded-lg border p-4 text-[0.85rem] leading-[1.7] outline-none transition-all font-mono scrollbar-thin ${isSubmitted
                                ? "bg-[var(--bg-card)] border-[var(--border-secondary)] text-[var(--text-muted)] opacity-50 cursor-not-allowed"
                                : "bg-[var(--input-bg)] border-[var(--border-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] opacity-40 focus:border-[var(--accent-border)] caret-[var(--accent)] focus:opacity-100"
                                }`}
                            style={{ fontFamily: "'DM Mono', monospace" }}
                        />
                        {!isSubmitted && (
                            <div className="flex items-center justify-between mt-3">
                                <span className="font-mono text-[0.62rem] text-[var(--text-muted)]">
                                    {answer.trim().split(/\s+/).filter(Boolean).length} words
                                </span>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!answer.trim()}
                                    className="bg-[var(--accent)] text-[var(--accent-text-on)] font-extrabold text-[0.8rem] tracking-[2px] uppercase px-7 py-2.5 rounded-lg hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_4px_14px_rgba(200,241,53,0.2)]"
                                >
                                    Submit & Score →
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Results panel */}
                <div className="overflow-hidden flex flex-col">
                    {submission.scoring === "idle" && (
                        <div className="flex flex-col items-center justify-center h-full text-center px-10 gap-4">
                            <div className="text-5xl opacity-20 text-[var(--text-primary)]">⚡</div>
                            <p className="text-[var(--text-muted)] text-sm leading-relaxed max-w-xs">
                                Write and submit your answer on the left. The AI judge will score it with partial
                                credit and explain every point.
                            </p>
                        </div>
                    )}

                    {(submission.scoring === "submitted" || submission.scoring === "polling") && (
                        <LoadingState scoringState={submission.scoring} />
                    )}

                    {submission.scoring === "error" && (
                        <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-3">
                            <div className="text-4xl">⚠️</div>
                            <p className="text-red-400 font-semibold">Something went wrong</p>
                            <p className="text-muted text-sm max-w-xs">{submission.error}</p>
                            <button
                                onClick={() => {
                                    setSubmission({ answer, scoring: "idle", result: null, error: null });
                                }}
                                className="mt-2 font-mono text-[0.72rem] text-[var(--accent)] border border-[var(--accent-border)] px-4 py-2 rounded hover:bg-[var(--accent-bg)] transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {submission.scoring === "done" && submission.result && (
                        <ScoringResults result={submission.result} hasNext={hasNext} onNext={handleNext} />
                    )}
                </div>
            </div>
        </div>
    );
}