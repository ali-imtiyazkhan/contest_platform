"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { ChevronLeft, ArrowRight, Target, Layout } from "lucide-react";

import { BACKEND_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthProvider";
import { SiteHeader } from "@/components/site-header";

type Challenge = {
    id: string;
    title: string;
    maxPoints: number;
    description: string;
};

type Contest = {
    id: string;
    title: string;
    description?: string;
    contestToChallengeMapping: {
        index: number;
        challengeId: string;
        challenge: Challenge;
    }[];
};

export default function ContestDetailPage() {
    const params = useParams();
    const router = useRouter();
    const contestId = params?.contestId as string;
    const { accessToken, loading: authLoading } = useAuth();

    const [contest, setContest] = useState<Contest | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !accessToken) {
            router.push("/signin");
        }
    }, [authLoading, accessToken, router]);

    const fetchContest = async () => {
        try {
            const res = await axios.get(
                `${BACKEND_URL}/api/v1/contest/${contestId}`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    withCredentials: true,
                }
            );
            setContest(res.data.data);
        } catch (error) {
            console.error("Failed to load contest:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (contestId && accessToken) fetchContest();
    }, [contestId, accessToken]);

    if (loading || authLoading) return <ContestLoadingSkeleton />;

    if (!contest) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white space-y-6">
                <p className="text-xl font-medium text-zinc-500">
                    Contest not found in the archives.
                </p>
                <div className="flex gap-4">
                    <Button onClick={() => router.push("/dashboard")} variant="outline" className="border-zinc-800 bg-zinc-900">
                        Dashboard
                    </Button>
                    <Button onClick={() => router.push("/leaderboard")} variant="outline" className="border-zinc-800 bg-zinc-900">
                        Leaderboard
                    </Button>
                </div>
            </div>
        );
    }

    const totalPoints = contest.contestToChallengeMapping.reduce(
        (acc, curr) => acc + curr.challenge.maxPoints,
        0
    );

    return (
        <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
            <SiteHeader />

            <main className="max-w-full mx-auto px-6 sm:px-8 lg:px-12 py-12 space-y-12">
                {/* Back Button */}
                <button
                    onClick={() => router.push("/dashboard")}
                    className="group flex items-center text-sm font-medium text-zinc-500 hover:text-white transition-colors"
                >
                    <ChevronLeft className="h-4 w-4 mr-1 transition-transform group-hover:-translate-x-1" />
                    Return to Arena
                </button>

                {/* Hero / Overview Section */}
                <Card className="bg-zinc-950 border-zinc-900 rounded-3xl overflow-hidden">
                    <CardHeader className="p-8 md:p-12">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                            <div className="space-y-4">
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1">
                                    MISSION ACTIVE
                                </Badge>
                                <CardTitle className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                                    {contest.title}
                                </CardTitle>
                                <CardDescription className="max-w-2xl text-lg text-zinc-400 leading-relaxed">
                                    {contest.description || "Complete all challenges to earn maximum points and climb the leaderboard."}
                                </CardDescription>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                <div className="bg-zinc-900/50 border border-zinc-800 px-8 py-5 rounded-2xl text-center min-w-[140px]">
                                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">
                                        Total Points
                                    </p>
                                    <p className="text-3xl font-black text-emerald-500">
                                        {totalPoints}
                                    </p>
                                </div>
                                <div className="bg-zinc-900/50 border border-zinc-800 px-8 py-5 rounded-2xl text-center min-w-[140px]">
                                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">
                                        Tasks
                                    </p>
                                    <p className="text-3xl font-black text-white">
                                        {contest.contestToChallengeMapping.length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Problem List Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 px-2">
                        <Layout className="h-5 w-5 text-emerald-500" />
                        <h2 className="text-xl font-bold text-zinc-200">Challenge Manifest</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 pb-20">
                        {contest.contestToChallengeMapping
                            .sort((a, b) => a.index - b.index)
                            .map((item) => (
                                <Card
                                    key={item.challengeId}
                                    className="group bg-zinc-950 border-zinc-900 transition-all duration-300 hover:border-emerald-500/30 hover:bg-zinc-900/20 rounded-2xl overflow-hidden"
                                >
                                    <CardContent className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                        <div className="flex items-start gap-6">
                                            <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl text-xl font-bold text-emerald-500 group-hover:border-emerald-500/50 transition-colors">
                                                {item.index + 1}
                                            </div>

                                            <div className="space-y-2">
                                                <h3 className="text-xl font-bold text-zinc-100 group-hover:text-white transition-colors">
                                                    {item.challenge.title}
                                                </h3>
                                                <p className="text-zinc-400 line-clamp-2 max-w-2xl leading-relaxed">
                                                    {item.challenge.description}
                                                </p>
                                                <div className="flex items-center gap-4 pt-2">
                                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
                                                        <Target className="h-3.5 w-3.5" />
                                                        MAX SCORE: {item.challenge.maxPoints}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            className="h-12 px-8 bg-zinc-100 hover:bg-white text-black font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                            onClick={() =>
                                                router.push(
                                                    `/contest/${contestId}/challenge/${item.challengeId}`
                                                )
                                            }
                                        >
                                            Initialize
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

function ContestLoadingSkeleton() {
    return (
        <div className="min-h-screen bg-black p-10 space-y-12">
            <div className="max-w-7xl mx-auto space-y-8">
                <Skeleton className="h-6 w-32 bg-zinc-900" />
                <Skeleton className="h-64 w-full rounded-3xl bg-zinc-900" />
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-2xl bg-zinc-900" />
                ))}
            </div>
        </div>
    );
}