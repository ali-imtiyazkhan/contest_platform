"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { ChevronLeft, ArrowRight } from "lucide-react";

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
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <p className="text-xl font-medium text-muted-foreground">
                    Contest not found
                </p>
                <Button onClick={() => router.push("/dashboard")} variant="outline">
                    Return to Dashboard
                </Button>
            </div>
        );
    }

    const totalPoints = contest.contestToChallengeMapping.reduce(
        (acc, curr) => acc + curr.challenge.maxPoints,
        0
    );

    return (
        <div className="min-h-screen bg-linear-to-b from-slate-50 to-white">
            <div className="max-w-6xl mx-auto px-6 py-14 space-y-12">
                {/* Back */}
                <button
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to Challenges
                </button>

                {/* Hero Card */}
                <Card className="border shadow-sm">
                    <CardHeader className="space-y-6 p-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div className="space-y-3">
                                <CardTitle className="text-4xl">
                                    {contest.title}
                                </CardTitle>
                                <CardDescription className="max-w-2xl text-base">
                                    {contest.description ||
                                        "Complete all challenges to earn maximum points and climb the leaderboard."}
                                </CardDescription>
                            </div>

                            <div className="flex gap-6">
                                <div className="bg-muted px-6 py-4 rounded-lg border text-center">
                                    <p className="text-xs uppercase text-muted-foreground font-semibold">
                                        Total Points
                                    </p>
                                    <p className="text-2xl font-bold text-primary">
                                        {totalPoints}
                                    </p>
                                </div>
                                <div className="bg-muted px-6 py-4 rounded-lg border text-center">
                                    <p className="text-xs uppercase text-muted-foreground font-semibold">
                                        Challenges
                                    </p>
                                    <p className="text-2xl font-bold text-primary">
                                        {contest.contestToChallengeMapping.length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Problem List */}
                <div className="space-y-6">
                    {contest.contestToChallengeMapping
                        .sort((a, b) => a.index - b.index)
                        .map((item) => (
                            <Card
                                key={item.challengeId}
                                className="transition-all hover:shadow-md hover:border-primary/50"
                            >
                                <CardContent className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="flex items-start gap-6">
                                        <div className="w-14 h-14 flex items-center justify-center bg-muted rounded-lg text-xl font-bold text-muted-foreground">
                                            {item.index + 1}
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-lg font-semibold">
                                                {item.challenge.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2 max-w-xl">
                                                {item.challenge.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <Badge variant="secondary" className="font-mono">
                                            {item.challenge.maxPoints} pts
                                        </Badge>

                                        <Button
                                            onClick={() =>
                                                router.push(
                                                    `/contest/${contestId}/challenge/${item.challengeId}`
                                                )
                                            }
                                        >
                                            Solve Challenge
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                </div>
            </div>
        </div>
    );

}

function ContestLoadingSkeleton() {
    return (
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-32 w-full rounded-xl" />
            {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
        </div>
    );
}
