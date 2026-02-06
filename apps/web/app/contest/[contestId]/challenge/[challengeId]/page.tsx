"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { ChevronLeft, Send, Code2, Terminal, Info } from "lucide-react";

import { BACKEND_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthProvider";
import { SiteHeader } from "@/components/site-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";


type Challenge = {
    id: string;
    title: string;
    description: string;
    maxPoints: number;
};

export default function ChallengePage() {
    const params = useParams();
    const router = useRouter();
    const { accessToken, loading: authLoading } = useAuth();

    const contestId = params.contestId as string;
    const challengeId = params.challengeId as string;

    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{
        verdict: string;
        marks: number;
        reason: string;
    } | null>(null);

    useEffect(() => {
        if (!authLoading && !accessToken) {
            router.push("/signin");
        }
    }, [authLoading, accessToken, router]);

    useEffect(() => {
        const fetchChallenge = async () => {
            try {
                const res = await axios.get(
                    `${BACKEND_URL}/api/v1/contest/${contestId}/challenge/${challengeId}`,
                    { withCredentials: true }
                );
                setChallenge(res.data.data.challenge);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (contestId && challengeId) fetchChallenge();
    }, [contestId, challengeId]);

    const handleSubmit = async () => {
        if (!code.trim() || submitting) return;

        try {
            setSubmitting(true);
            setResult(null);

            const res = await axios.post(
                `${BACKEND_URL}/api/v1/contest/${contestId}/challenge/${challengeId}/submit`,
                { submission: code },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    withCredentials: true,
                }
            );

            setResult({
                verdict: res.data.verdict,
                marks: res.data.marks,
                reason: res.data.reason,
            });

            const nextId = res.data.nextChallengeId;

            setTimeout(() => {
                if (nextId) {
                    router.replace(`/contest/${contestId}/challenge/${nextId}`);
                    // Reset local state for next challenge
                    setCode("");
                    setResult(null);
                } else {
                    router.replace(`/contest/${contestId}/finalpage`);
                }
            }, 10000); // Reduced to 10s for better UX, adjust as needed
        } catch (err: any) {
            alert(err?.response?.data?.message || "Submission failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <ChallengeLoadingSkeleton />;

    if (!challenge) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-zinc-500">
                <Info className="h-12 w-12 mb-4" />
                <p className="text-xl">Challenge data encrypted or missing.</p>
                <Button variant="link" onClick={() => router.back()} className="text-emerald-500">Go Back</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
            <SiteHeader />

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Navigation & Title */}
                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-sm font-medium text-zinc-500 hover:text-white transition-colors w-fit"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back to Contest
                    </button>
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                            <Code2 className="text-emerald-500 h-8 w-8" />
                            {challenge.title}
                        </h1>
                        <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-400 px-4 py-1">
                            Max Points: {challenge.maxPoints}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Problem Description */}
                    <Card className="bg-zinc-950 border-zinc-900 h-fit">
                        <CardHeader className="border-b border-zinc-900">
                            <CardTitle className="text-sm font-mono text-zinc-400 flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                PROBLEM_BRIEFING.md
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="whitespace-pre-wrap text-zinc-300 leading-relaxed">
                                {challenge.description}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Right Column: Code Editor Space */}
                    <div className="space-y-6">
                        <Card className="bg-zinc-950 border-zinc-900 overflow-hidden">
                            <CardHeader className="bg-zinc-900/50 border-b border-zinc-900 py-3 px-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xs font-mono text-zinc-500 flex items-center gap-2">
                                        <Terminal className="h-3.5 w-3.5" />
                                        SOLUTION_BUFFER
                                    </CardTitle>
                                    <span className="text-[10px] text-zinc-600 font-mono italic">// UTF-8 ENCODED</span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Textarea
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="Enter your source code or solution logic here..."
                                    className="min-h-100 bg-black border-none text-emerald-50 font-mono p-6 focus-visible:ring-0 resize-none placeholder:text-zinc-800"
                                />
                            </CardContent>
                            <div className="p-4 bg-zinc-900/30 border-t border-zinc-900 flex justify-end">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={submitting || !code.trim()}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 rounded-lg transition-all"
                                >
                                    {submitting ? (
                                        <span className="flex items-center gap-2">
                                            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Executing...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Submit Solution
                                            <Send className="h-4 w-4" />
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </Card>

                        {/* Submission Result */}
                        {result && (
                            <Card className={`border ${result.marks > 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'} transition-all animate-in fade-in slide-in-from-bottom-4`}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className={`font-bold uppercase tracking-wider ${result.marks > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            System Verdict: {result.verdict}
                                        </h3>
                                        <Badge variant="outline" className={result.marks > 0 ? 'border-emerald-500/50 text-emerald-400' : 'border-rose-500/50 text-rose-400'}>
                                            Score: {result.marks} / {challenge.maxPoints}
                                        </Badge>
                                    </div>
                                    <div className="p-4 bg-black/40 rounded-lg border border-white/5 font-mono text-sm text-zinc-300">
                                        {result.reason}
                                    </div>
                                    <p className="text-[10px] text-zinc-500 mt-4 italic text-center uppercase tracking-tighter">
                                        Redirecting to next phase in 10 seconds...
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function ChallengeLoadingSkeleton() {
    return (
        <div className="min-h-screen bg-black p-12 space-y-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <Skeleton className="h-8 w-64 bg-zinc-900" />
                <div className="grid grid-cols-2 gap-8">
                    <Skeleton className="h-125 w-full bg-zinc-900 rounded-2xl" />
                    <Skeleton className="h-125 w-full bg-zinc-900 rounded-2xl" />
                </div>
            </div>
        </div>
    );
}