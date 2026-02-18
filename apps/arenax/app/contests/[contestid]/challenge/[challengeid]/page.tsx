"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CONTESTS, Challenge, Contest } from "../../../../../lib/contestData";


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

interface SubmissionState {
    answer: string;
    scoring: "idle" | "loading" | "done" | "error";
    result: ScoreResult | null;
    error: string | null;
}


function getDimensions(type: string): string[] {
    switch (type) {
        case "Code":
            return ["Correctness", "Logic & Approach", "Edge Cases", "Clarity"];
        case "Creative":
        case "Written":
            return ["Relevance", "Quality of Argument", "Clarity & Structure", "Originality"];
        case "Open":
        case "Open Problem":
            return ["Correctness", "Depth of Reasoning", "Completeness", "Clarity"];
        case "Multi-part":
        case "Calculation":
            return ["Correctness", "Method Shown", "Accuracy", "Completeness"];
        default:
            return ["Correctness", "Completeness", "Clarity", "Reasoning"];
    }
}

async function scoreAnswer(challenge: Challenge, userAnswer: string): Promise<ScoreResult> {
    const dimensions = getDimensions(challenge.type);

    const systemPrompt = `You are an expert contest judge. Evaluate answers with PARTIAL CREDIT — never jump straight to 0 unless completely blank or fundamentally wrong.

PARTIAL CREDIT RULES:
- Correct approach + arithmetic errors = 60-75%
- Correct method + minor gaps = 75-90%
- Full, correct, clearly explained = 100%
- Completely off-topic or blank = 0%

SCORING DIMENSIONS (each 0-10):
${dimensions.map((d, i) => `${i + 1}. ${d}`).join("\n")}

Final score = weighted average of dimensions (0-100).

Return ONLY valid JSON, no markdown:
{
  "score": <0-100>,
  "verdict": "<full|partial|zero>",
  "summary": "<one sentence max 12 words>",
  "breakdown": [
    { "label": "<dimension>", "score": <0-10>, "max": 10, "comment": "<1-2 sentences referencing their actual answer>" }
  ],
  "strengths": ["<specific strength>"],
  "mistakes": ["<specific error or logical gap>"],
  "modelAnswer": "<3-5 sentences: what a perfect answer contains, educational tone>"
}

Rules:
- verdict = "full" if score >= 85, "partial" if 20-84, "zero" if < 20
- strengths always has at least one item unless blank submission
- mistakes = [] if perfect answer
- BE SPECIFIC — reference what they actually wrote, not generic praise`;

    const userPrompt = `CHALLENGE: ${challenge.title}
TYPE: ${challenge.type}
MAX POINTS: ${challenge.points}

QUESTION:
${challenge.question}
${challenge.hint ? `\nHINT SHOWN TO PARTICIPANT: ${challenge.hint}` : ""}

PARTICIPANT ANSWER:
${userAnswer || "(blank)"}

Score with partial credit. Return JSON only.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
        }),
    });

    if (!response.ok) throw new Error(`API error ${response.status}`);

    const data = await response.json();
    const raw = data.content
        .map((b: { type: string; text?: string }) => b.type === "text" ? b.text : "")
        .join("")
        .replace(/```json|```/g, "")
        .trim();

    const parsed = JSON.parse(raw);
    return {
        ...parsed,
        pointsAwarded: Math.round((parsed.score / 100) * challenge.points),
        maxPoints: challenge.points,
    };
}


function ScoreBar({ score, max, color }: { score: number; max: number; color: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(score / max) * 100}%`, background: color }}
                />
            </div>
            <span className="font-mono text-[0.72rem] text-cream/60 w-8 text-right">{score}/{max}</span>
        </div>
    );
}

function HintBlock({ hint }: { hint: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="mt-5 border border-white/[0.08] rounded-lg overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors text-left"
            >
                <span className="font-mono text-[0.65rem] text-muted tracking-[2px] uppercase flex items-center gap-2">
                    <span className="text-acid">💡</span> Show Hint
                </span>
                <span className={`text-muted text-xs transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▼</span>
            </button>
            {open && (
                <div className="px-4 pb-4 pt-2 font-mono text-[0.78rem] text-muted leading-[1.6] border-t border-white/[0.06] bg-white/[0.02]">
                    {hint}
                </div>
            )}
        </div>
    );
}

function LoadingState() {
    const steps = ["Reading your answer…", "Checking correctness…", "Evaluating logic…", "Calculating partial credit…", "Writing feedback…"];
    const [step, setStep] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 1000);
        return () => clearInterval(id);
    }, []);
    return (
        <div className="flex flex-col items-center justify-center h-full gap-6 px-8">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-acid/20" />
                <div className="absolute inset-0 rounded-full border-2 border-acid border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-acid text-xl">⚡</div>
            </div>
            <div className="text-center">
                <p className="text-cream font-semibold text-sm mb-2 transition-all duration-500">{steps[step]}</p>
                <p className="font-mono text-[0.62rem] text-muted tracking-widest uppercase">AI judge evaluating…</p>
            </div>
            <div className="flex gap-1.5">
                {steps.map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i <= step ? "bg-acid" : "bg-white/10"}`} />
                ))}
            </div>
        </div>
    );
}

function ScoringResults({ result, hasNext, onNext }: { result: ScoreResult; hasNext: boolean; onNext: () => void }) {
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
                    <div className={`font-extrabold leading-none ${verdictCfg.text}`}
                        style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "2.8rem" }}>
                        {result.pointsAwarded}<span className="text-xl text-muted">/{result.maxPoints}</span>
                    </div>
                    <div className="font-mono text-[0.6rem] text-muted tracking-widest uppercase mt-0.5">Points</div>
                </div>
            </div>

            {/* Score circle + label */}
            <div className="flex items-center gap-5 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="relative w-[72px] h-[72px] flex-shrink-0">
                    <svg width="72" height="72" className="-rotate-90">
                        <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
                        <circle cx="36" cy="36" r="30" fill="none"
                            stroke={result.score >= 85 ? "#c8f135" : result.score >= 50 ? "#f5a623" : "#ef4444"}
                            strokeWidth="5" strokeLinecap="round"
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

            {/* Dimension breakdown */}
            <div>
                <div className="font-mono text-[0.6rem] text-muted tracking-[2px] uppercase mb-3">Score Breakdown</div>
                <div className="space-y-3">
                    {result.breakdown.map(dim => {
                        const pct = dim.score / dim.max;
                        const color = pct >= 0.85 ? "#c8f135" : pct >= 0.5 ? "#f5a623" : "#ef4444";
                        return (
                            <div key={dim.label} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-cream text-[0.85rem]">{dim.label}</span>
                                    <span className="font-mono text-[0.72rem] font-bold" style={{ color }}>{dim.score}/{dim.max}</span>
                                </div>
                                <ScoreBar score={dim.score} max={dim.max} color={color} />
                                <p className="text-muted text-[0.76rem] leading-[1.6] mt-2.5">{dim.comment}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Strengths */}
            {result.strengths.length > 0 && (
                <div className="rounded-lg border border-acid/20 bg-acid/[0.04] p-4">
                    <div className="font-mono text-[0.6rem] tracking-[2px] uppercase text-acid mb-3">✓ What You Did Well</div>
                    <ul className="space-y-2">
                        {result.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-[0.8rem] text-cream/80 leading-[1.5]">
                                <span className="text-acid font-bold mt-0.5 flex-shrink-0">✓</span>{s}
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
                                <span className="text-red-400 font-bold mt-0.5 flex-shrink-0">✗</span>{m}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Model answer */}
            <div className="border border-white/[0.08] rounded-lg overflow-hidden">
                <button
                    onClick={() => setModelOpen(o => !o)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors text-left"
                >
                    <span className="font-mono text-[0.65rem] tracking-[2px] uppercase text-muted flex items-center gap-2">
                        <span className="text-acid">📖</span> What a Full-Mark Answer Looks Like
                    </span>
                    <span className={`text-muted text-xs transition-transform duration-200 ${modelOpen ? "rotate-180" : ""}`}>▼</span>
                </button>
                {modelOpen && (
                    <div className="px-5 pb-5 pt-2 border-t border-white/[0.06] bg-white/[0.02]">
                        <p className="text-cream/80 text-[0.83rem] leading-[1.75] whitespace-pre-line">{result.modelAnswer}</p>
                    </div>
                )}
            </div>

            {/* Next button */}
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


export default function ChallengePage() {
    const params = useParams();
    const router = useRouter();
    const contestId = params.contestid as string;
    const challengeId = params.challengeid as string;

    const contest = CONTESTS.find(c => c.id === contestId);
    const challengeIndex = contest ? contest.challenges.findIndex(ch => ch.id === challengeId) : -1;
    const challenge = contest?.challenges[challengeIndex];

    const hasNext = !!contest && challengeIndex < (contest?.challenges.length ?? 0) - 1;
    const nextChallenge = hasNext && contest ? contest.challenges[challengeIndex + 1] : null;

    const [submission, setSubmission] = useState<SubmissionState>({
        answer: "", scoring: "idle", result: null, error: null,
    });
    const [answer, setAnswer] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setSubmission({ answer: "", scoring: "idle", result: null, error: null });
        setAnswer("");
        setTimeout(() => textareaRef.current?.focus(), 100);
    }, [challengeId]);

    const handleSubmit = async () => {
        if (!challenge || !answer.trim()) return;
        setSubmission({ answer, scoring: "loading", result: null, error: null });
        try {
            const result = await scoreAnswer(challenge, answer);
            setSubmission({ answer, scoring: "done", result, error: null });
        } catch (err) {
            setSubmission({ answer, scoring: "error", result: null, error: err instanceof Error ? err.message : "Error" });
        }
    };

    const handleNext = () => {
        if (hasNext && contest && nextChallenge) {
            router.push(`/contests/${contest.id}/challenges/${nextChallenge.id}`);
        } else {
            router.push(`/leaderboard?contestId=${contestId}`);
        }
    };

    if (!contest || !challenge || challengeIndex === -1) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 text-cream">
                <div className="text-5xl font-extrabold" style={{ fontFamily: "'Bebas Neue', cursive" }}>Not Found</div>
                <Link href="/contests" className="text-acid font-mono text-sm hover:underline no-underline">← Back</Link>
            </div>
        );
    }

    const isSubmitted = submission.scoring !== "idle";

    return (
        <div className="h-screen flex flex-col bg-[#0a0a0a] text-cream overflow-hidden" style={{ fontFamily: "'Syne', sans-serif" }}>

            {/* Top bar */}
            <header className="h-12 flex items-center justify-between px-5 border-b border-white/[0.07] bg-black/80 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-center gap-2 font-mono text-[0.7rem] text-muted min-w-0">
                    <Link href="/contests" className="hover:text-cream transition-colors no-underline flex-shrink-0">Contests</Link>
                    <span className="text-white/20">/</span>
                    <span className="text-cream/60 truncate hidden sm:block">{contest.title}</span>
                    <span className="text-white/20 hidden sm:block">/</span>
                    <span className="text-acid truncate">{challenge.title}</span>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
                    {contest.challenges.map((_, i) => (
                        <div key={i} className={`rounded-full transition-all duration-300 ${i < challengeIndex ? "w-2 h-2 bg-acid/60" : i === challengeIndex ? "w-2.5 h-2.5 bg-acid" : "w-2 h-2 bg-white/[0.1]"
                            }`} />
                    ))}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono text-[0.68rem] text-muted">
                        <span className="text-cream font-bold">{challengeIndex + 1}</span>
                        <span className="text-white/20"> / </span>{contest.challenges.length}
                    </span>
                    <Link href={`/leaderboard?contestId=${contestId}`}
                        className="font-mono text-[0.62rem] text-muted border border-white/[0.08] px-2.5 py-1 rounded hover:border-acid/40 hover:text-acid transition-colors no-underline hidden sm:flex items-center gap-1.5">
                        🏆 Leaderboard
                    </Link>
                </div>
            </header>

            {/* Split screen */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">

                {/* ── LEFT: Question + Answer ── */}
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
                            <span className="font-mono text-[0.65rem] font-bold text-acid ml-auto">+{challenge.points} pts</span>
                        </div>

                        <h2 className="text-cream font-extrabold text-xl leading-tight mb-5">{challenge.title}</h2>

                        <div className="font-mono text-[0.6rem] text-muted tracking-[2px] uppercase mb-3 flex items-center gap-2">
                            <span className="w-0.5 h-3 bg-acid rounded-full" />Question
                        </div>

                        <div className="text-cream text-[0.93rem] leading-[1.8] whitespace-pre-line">{challenge.question}</div>

                        {challenge.hint && <HintBlock hint={challenge.hint} />}
                    </div>

                    {/* Answer area (fixed at bottom of left panel) */}
                    <div className="border-t border-white/[0.07] flex-shrink-0 bg-[#0d0d0f] px-6 pt-4 pb-5">
                        <div className="font-mono text-[0.6rem] text-muted tracking-[2px] uppercase mb-2 flex items-center gap-2">
                            <span className="w-0.5 h-3 bg-white/20 rounded-full" />
                            {isSubmitted ? (
                                <span className="text-acid/70">✓ Answer submitted</span>
                            ) : "Your Answer"}
                        </div>
                        <textarea
                            ref={textareaRef}
                            value={answer}
                            onChange={e => !isSubmitted && setAnswer(e.target.value)}
                            onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSubmit(); }}
                            disabled={isSubmitted}
                            rows={6}
                            placeholder={isSubmitted ? "" : "Type your answer… (Ctrl+Enter to submit)"}
                            className={`w-full resize-none rounded-lg border p-4 text-[0.85rem] leading-[1.7] outline-none transition-all font-mono scrollbar-thin
                ${isSubmitted
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

                {/* ── RIGHT: AI Scoring Panel ── */}
                <div className="overflow-hidden flex flex-col">
                    {submission.scoring === "idle" && (
                        <div className="flex flex-col items-center justify-center h-full text-center px-10 gap-4">
                            <div className="text-5xl opacity-20">⚡</div>
                            <p className="text-muted text-sm leading-relaxed max-w-xs">
                                Write and submit your answer on the left. The AI judge will score it with partial credit and explain every point.
                            </p>
                        </div>
                    )}
                    {submission.scoring === "loading" && <LoadingState />}
                    {submission.scoring === "error" && (
                        <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-3">
                            <div className="text-4xl">⚠️</div>
                            <p className="text-red-400 font-semibold">Scoring failed</p>
                            <p className="text-muted text-sm">{submission.error}</p>
                            <button
                                onClick={handleSubmit}
                                className="mt-2 font-mono text-[0.72rem] text-acid border border-acid/30 px-4 py-2 rounded hover:bg-acid/10 transition-colors"
                            >
                                Retry
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
