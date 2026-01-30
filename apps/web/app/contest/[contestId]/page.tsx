"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

import { BACKEND_URL } from "@/config";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

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

    // ✅ HOOK MUST BE HERE (inside component)
    const { accessToken, loading: authLoading } = useAuth();

    const [contest, setContest] = useState<Contest | null>(null);
    const [loading, setLoading] = useState(true);

    // 🔐 Redirect if not authenticated
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
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
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
        if (contestId && accessToken) {
            fetchContest();
        }
    }, [contestId, accessToken]);

    if (loading || authLoading) {
        return (
            <p className="p-6 text-muted-foreground">
                Loading contest...
            </p>
        );
    }

    if (!contest) {
        return (
            <p className="p-6 text-red-500">
                Contest not found.
            </p>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">
                    {contest.title}
                </h1>
                {contest.description && (
                    <p className="text-muted-foreground">
                        {contest.description}
                    </p>
                )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {contest.contestToChallengeMapping.map((item) => (
                    <Card key={item.challengeId}>
                        <CardHeader>
                            <CardTitle>{item.challenge.title}</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                {item.challenge.description}
                            </p>

                            <div className="flex items-center justify-between">
                                <span>Points: {item.challenge.maxPoints}</span>

                                <Button
                                    onClick={() =>
                                        router.push(
                                            `/contest/${contestId}/challenge/${item.challengeId}`
                                        )
                                    }
                                >
                                    Open
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
