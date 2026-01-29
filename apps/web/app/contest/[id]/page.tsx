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

type Challenge = {
    id: string;
    title: string;
    points: number;
};

type Contest = {
    id: string;
    title: string;
    description?: string;
    contestToChallengeMapping: {
        index: number;
        challenge: Challenge;
    }[];
};

export default function ContestDetailPage() {
    const params = useParams();
    const router = useRouter();
    const contestId = params?.id as string;

    console.log("contestId is ", contestId)

    const [contest, setContest] = useState<Contest | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchContest = async () => {
        try {
            const res = await axios.get(
                `${BACKEND_URL}/api/v1/contest/${contestId}`,
                { withCredentials: true }
            );


            console.log("res is :", res);
            console.log("API URL:", `${BACKEND_URL}/api/v1/contest/${contestId}`);


            setContest(res.data.data);
        } catch (error) {
            console.error("Failed to load contest:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (contestId) fetchContest();
    }, [contestId]);

    if (loading) {
        return <p className="p-6 text-muted-foreground">Loading contest...</p>;
    }

    if (!contest) {
        return <p className="p-6 text-red-500">Contest not found.</p>;
    }

    return (
        <div className="p-6 space-y-6">
            {/* Contest Header */}
            <div>
                <h1 className="text-2xl font-semibold">{contest.title}</h1>
                {contest.description && (
                    <p className="text-muted-foreground">
                        {contest.description}
                    </p>
                )}
            </div>

            {/* Challenges */}
            <div className="grid gap-4 sm:grid-cols-2">
                {contest.contestToChallengeMapping.map((item) => (
                    <Card key={item.challenge.id}>
                        <CardHeader>
                            <CardTitle>{item.challenge.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <span>{item.challenge.points} pts</span>
                            <Button
                                onClick={() =>
                                    router.push(`/challenge/${item.challenge.id}`)
                                }
                            >
                                Open
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
