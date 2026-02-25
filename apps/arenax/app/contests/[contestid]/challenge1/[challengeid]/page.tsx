"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { env } from "process";
import next from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

//Types
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

        return { id: c.id, title: c.title, challenges };
    } catch (e) {
        console.error("Error fetching contest:", e);
        return null;
    }
}

async function submitAnswer(
    contestId: string,
    challengeId: string,
    submission: string
): Promise<{ ok: boolean; message?: string }> {
    try {

        const aiApiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || ""
        localStorage.setItem("aiApiKey", aiApiKey);

        const aiApiKey1 = localStorage.getItem("aiApiKey");

        const token = localStorage.getItem("token");
        const res = await fetch(
            `${API_BASE}/contest/${contestId}/challenge/${challengeId}/submit`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ submission, aiApiKey1 }),
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
            `http://localhost:4000/api/v1/contest/${contestId}/challenge/${challengeId}/result`,
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
            <div className="flex-1 h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(score / max) * 100}%`, background: color }}
                />
            </div>
            <span className="font-mono text-[0.72rem] text-cream/60 w-8 text-right">
                {score}/{max}
            </span>
        </div>
    );
}

function HintBlock({ hint }: { hint: string }) {
    const [open, setOpen] = useState(false);
    if (!hint) return null;
    return (
        <div className="mt-5 border border-white/[0.08] rounded-lg overflow-hidden">
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors text-left"
            >
                <span className="font-mono text-[0.65rem] text-muted tracking-[2px] uppercase flex items-center gap-2">
                    <span className="text-acid">💡</span> Show Hint
                </span>
                <span className={`text-muted text-xs transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
                    ▼
                </span>
            </button>
            {open && (
                <div className="px-4 pb-4 pt-2 font-mono text-[0.78rem] text-muted leading-[1.6] border-t border-white/[0.06] bg-white/[0.02]">
                    {hint}
                </div>
            )}
        </div>
    );
}

/** Animated loading panel shown while polling */
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
        // Advance the step label every ~1.5 s to look alive
        const id = setInterval(
            () => setStep((s) => Math.min(s + 1, steps.length - 1)),
            1500
        );
        return () => clearInterval(id);
    }, []);

    // Jump to "submitted" label instantly when state changes
    useEffect(() => {
        if (scoringState === "submitted") setStep(0);
        if (scoringState === "polling") setStep(1);
    }, [scoringState]);

    return (
        <div className="flex flex-col items-center justify-center h-full gap-6 px-8">
            {/* Spinner */}
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-acid/20" />
                <div className="absolute inset-0 rounded-full border-2 border-acid border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-acid text-xl">⚡</div>
            </div>

            {/* Step label */}
            <div className="text-center">
                <p className="text-cream font-semibold text-sm mb-2 transition-all duration-500">
                    {steps[step].label}
                </p>
                <p className="font-mono text-[0.62rem] text-muted tracking-widest uppercase">
                    Backend judging in progress
                </p>
            </div>

            {/* Dot progress */}
            <div className="flex gap-1.5">
                {steps.map((_, i) => (
                    <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i <= step ? "bg-acid" : "bg-white/10"
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
        full: { bg: "bg-acid/10 border-acid/30", text: "text-acid", icon: "🏆", label: "Full Marks" },
        partial: { bg: "bg-amber-400/10 border-amber-400/25", text: "text-amber-400", icon: "⚡", label: "Partial Credit" },
        zero: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-400", icon: "✗", label: "No Marks" },
    }[result.verdict];

    const [modelOpen, setModelOpen] = useState(false);

    return (
        <div className="h-full overflow-y-auto px-6 py-6 space-y-5 scrollbar-thin">
            {/* Verdict banner */}
            <div className={`rounded-xl border px-5 py-4 ${verdictCfg.bg} flex items-center justify-between gap-4`}>
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{verdictCfg.icon}</span>
                    <div>
                        <div className={`font-extrabold text-base ${verdictCfg.text}`}>{verdictCfg.label}</div>
                        <div className="text-cream/60 text-[0.8rem] mt-0.5">{result.summary}</div>
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <div
                        className={`font-extrabold leading-none ${verdictCfg.text}`}
                        style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "2.8rem" }}
                    >
                        {result.pointsAwarded}
                        <span className="text-xl text-muted">/{result.maxPoints}</span>
                    </div>
                    <div className="font-mono text-[0.6rem] text-muted tracking-widest uppercase mt-0.5">Points</div>
                </div>
            </div>

            {/* Score circle */}
            <div className="flex items-center gap-5 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="relative w-[72px] h-[72px] flex-shrink-0">
                    <svg width="72" height="72" className="-rotate-90">
                        <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
                        <circle
                            cx="36" cy="36" r="30" fill="none"
                            stroke={result.score >= 85 ? "#c8f135" : result.score >= 50 ? "#f5a623" : "#ef4444"}
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={`${(result.score / 100) * 188.5} 188.5`}
                            className="transition-all duration-1000"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-mono font-bold text-cream text-base">{result.score}%</span>
                    </div>
                </div>
                <div>
                    <div className="text-cream font-bold text-sm mb-1">Overall Score</div>
                    <div className="text-muted text-[0.78rem] leading-[1.5]">
                        Scored across {result.breakdown.length} dimensions. Partial credit applied where applicable.
                    </div>
                </div>
            </div>

            {/* Breakdown */}
            {result.breakdown.length > 0 && (
                <div>
                    <div className="font-mono text-[0.6rem] text-muted tracking-[2px] uppercase mb-3">Score Breakdown</div>
                    <div className="space-y-3">
                        {result.breakdown.map((dim) => {
                            const pct = dim.score / dim.max;
                            const color = pct >= 0.85 ? "#c8f135" : pct >= 0.5 ? "#f5a623" : "#ef4444";
                            return (
                                <div key={dim.label} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-cream text-[0.85rem]">{dim.label}</span>
                                        <span className="font-mono text-[0.72rem] font-bold" style={{ color }}>
                                            {dim.score}/{dim.max}
                                        </span>
                                    </div>
                                    <ScoreBar score={dim.score} max={dim.max} color={color} />
                                    <p className="text-muted text-[0.76rem] leading-[1.6] mt-2.5">{dim.comment}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Strengths */}
            {result.strengths.length > 0 && (
                <div className="rounded-lg border border-acid/20 bg-acid/[0.04] p-4">
                    <div className="font-mono text-[0.6rem] tracking-[2px] uppercase text-acid mb-3">✓ What You Did Well</div>
                    <ul className="space-y-2">
                        {result.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-[0.8rem] text-cream/80 leading-[1.5]">
                                <span className="text-acid font-bold mt-0.5 flex-shrink-0">✓</span>
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
                            <li key={i} className="flex items-start gap-2 text-[0.8rem] text-cream/80 leading-[1.5]">
                                <span className="text-red-400 font-bold mt-0.5 flex-shrink-0">✗</span>
                                {m}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Model answer */}
            {result.modelAnswer && (
                <div className="border border-white/[0.08] rounded-lg overflow-hidden">
                    <button
                        onClick={() => setModelOpen((o) => !o)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors text-left"
                    >
                        <span className="font-mono text-[0.65rem] tracking-[2px] uppercase text-muted flex items-center gap-2">
                            <span className="text-acid">📖</span> What a Full-Mark Answer Looks Like
                        </span>
                        <span className={`text-muted text-xs transition-transform duration-200 ${modelOpen ? "rotate-180" : ""}`}>
                            ▼
                        </span>
                    </button>
                    {modelOpen && (
                        <div className="px-5 pb-5 pt-2 border-t border-white/[0.06] bg-white/[0.02]">
                            <p className="text-cream/80 text-[0.83rem] leading-[1.75] whitespace-pre-line">
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
                    className="w-full bg-acid text-black font-extrabold text-[0.85rem] tracking-[2px] uppercase py-4 rounded-lg hover:opacity-90 hover:-translate-y-0.5 transition-all duration-150 shadow-[0_6px_20px_rgba(200,241,53,0.2)]"
                >
                    {hasNext ? "Next Challenge →" : "View Leaderboard →"}
                </button>
            </div>
        </div>
    );
}

// Main Page 
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

    /** Start polling the backend until we get a judged result */
    const startPolling = useCallback(() => {
        pollStartRef.current = Date.now();

        pollRef.current = setInterval(async () => {
            // Timeout guard
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
            // else still Pending/Judging — keep polling
        }, POLL_INTERVAL_MS);
    }, [contestId, challengeId, stopPolling]);

    const handleSubmit = async () => {
        if (!answer.trim()) return;

        setSubmission({ answer, scoring: "submitted", result: null, error: null });

        const submitResult = await submitAnswer(contestId, challengeId, answer);

        if (!submitResult.ok) {
            setSubmission({
                answer,
                scoring: "error",
                result: null,
                error: submitResult.message || "Submission failed",
            });
            return;
        }

        // Backend accepted the submission — now poll for the judged result
        setSubmission((prev) => ({ ...prev, scoring: "polling" }));
        startPolling();
    };

    const handleNext = () => {
        if (!contest) return;
        const idx = contest.challenges.findIndex((ch) => ch.id === challengeId);
        const next = contest.challenges[idx + 1];
        if (next) {
            router.push(`/contests/${contest.id}/challenges/${next.id}`);
        } else {
            router.push(`/leaderboard?contestId=${contestId}`);
        }
    };

    // ── derived ──
    const challengeIndex = contest
        ? contest.challenges.findIndex((ch) => ch.id === challengeId)
        : -1;
    const challenge = contest?.challenges[challengeIndex];
    const hasNext = !!contest && challengeIndex < contest.challenges.length - 1;
    const isSubmitted = submission.scoring !== "idle";

    // ── render guards ──
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="text-acid text-xl font-mono">Loading challenge...</div>
            </div>
        );
    }

    if (!contest || !challenge || challengeIndex === -1) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 text-cream">
                <div className="text-5xl font-extrabold" style={{ fontFamily: "'Bebas Neue', cursive" }}>
                    Not Found
                </div>
                <Link href="/contests" className="text-acid font-mono text-sm hover:underline no-underline">
                    ← Back to Contests
                </Link>
            </div>
        );
    }

    return (
        <div
            className="h-screen flex flex-col bg-[#0a0a0a] text-cream overflow-hidden"
            style={{ fontFamily: "'Syne', sans-serif" }}
        >
            {/* ── Top bar ── */}
            <header className="h-12 flex items-center justify-between px-5 border-b border-white/[0.07] bg-black/80 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-center gap-2 font-mono text-[0.7rem] text-muted min-w-0">
                    <Link href="/contests" className="hover:text-cream transition-colors no-underline flex-shrink-0">
                        Contests
                    </Link>
                    <span className="text-white/20">/</span>
                    <span className="text-cream/60 truncate hidden sm:block">{contest.title}</span>
                    <span className="text-white/20 hidden sm:block">/</span>
                    <span className="text-acid truncate">{challenge.title}</span>
                </div>

                {/* Progress dots */}
                <div className="flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
                    {contest.challenges.map((_, i) => (
                        <div
                            key={i}
                            className={`rounded-full transition-all duration-300 ${i < challengeIndex
                                ? "w-2 h-2 bg-acid/60"
                                : i === challengeIndex
                                    ? "w-2.5 h-2.5 bg-acid"
                                    : "w-2 h-2 bg-white/[0.1]"
                                }`}
                        />
                    ))}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono text-[0.68rem] text-muted">
                        <span className="text-cream font-bold">{challengeIndex + 1}</span>
                        <span className="text-white/20"> / </span>
                        {contest.challenges.length}
                    </span>
                    <Link
                        href={`/leaderboard?contestId=${contestId}`}
                        className="font-mono text-[0.62rem] text-muted border border-white/[0.08] px-2.5 py-1 rounded hover:border-acid/40 hover:text-acid transition-colors no-underline hidden sm:flex items-center gap-1.5"
                    >
                        🏆 Leaderboard
                    </Link>
                </div>
            </header>

            {/* ── Split screen ── */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
                {/* LEFT: Question + Answer */}
                <div className="flex flex-col border-r border-white/[0.07] overflow-hidden">
                    {/* Question (scrollable) */}
                    <div className="flex-1 overflow-y-auto px-7 py-6 scrollbar-thin min-h-0">
                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                            <span className="font-mono text-[0.6rem] tracking-[2px] uppercase text-acid bg-acid/10 border border-acid/20 px-2 py-0.5 rounded-sm">
                                Challenge {challengeIndex + 1}
                            </span>
                            <span className="font-mono text-[0.6rem] tracking-widest uppercase text-muted border border-white/[0.08] px-2 py-0.5 rounded-sm">
                                {challenge.type}
                            </span>
                            <span className="font-mono text-[0.65rem] font-bold text-acid ml-auto">
                                +{challenge.maxPoints} pts
                            </span>
                        </div>

                        <h2 className="text-cream font-extrabold text-xl leading-tight mb-5">
                            {challenge.title}
                        </h2>

                        <div className="font-mono text-[0.6rem] text-muted tracking-[2px] uppercase mb-3 flex items-center gap-2">
                            <span className="w-0.5 h-3 bg-acid rounded-full" />
                            Question
                        </div>

                        <div className="text-cream text-[0.93rem] leading-[1.8] whitespace-pre-line">
                            {challenge.question}
                        </div>

                        {challenge.hint && <HintBlock hint={challenge.hint} />}
                    </div>

                    {/* Answer area */}
                    <div className="border-t border-white/[0.07] flex-shrink-0 bg-[#0d0d0f] px-6 pt-4 pb-5">
                        <div className="font-mono text-[0.6rem] text-muted tracking-[2px] uppercase mb-2 flex items-center gap-2">
                            <span className="w-0.5 h-3 bg-white/20 rounded-full" />
                            {isSubmitted ? (
                                <span className="text-acid/70">✓ Answer submitted — judging in progress</span>
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
                                ? "bg-white/[0.03] border-white/[0.06] text-cream/50 cursor-not-allowed"
                                : "bg-white/[0.04] border-white/10 text-cream placeholder:text-muted/40 focus:border-acid/40 caret-acid"
                                }`}
                            style={{ fontFamily: "'DM Mono', monospace" }}
                        />
                        {!isSubmitted && (
                            <div className="flex items-center justify-between mt-3">
                                <span className="font-mono text-[0.62rem] text-muted">
                                    {answer.trim().split(/\s+/).filter(Boolean).length} words
                                </span>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!answer.trim()}
                                    className="bg-acid text-black font-extrabold text-[0.8rem] tracking-[2px] uppercase px-7 py-2.5 rounded-lg hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_4px_14px_rgba(200,241,53,0.2)]"
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
                            <div className="text-5xl opacity-20">⚡</div>
                            <p className="text-muted text-sm leading-relaxed max-w-xs">
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
                                className="mt-2 font-mono text-[0.72rem] text-acid border border-acid/30 px-4 py-2 rounded hover:bg-acid/10 transition-colors"
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