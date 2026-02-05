"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

import { BACKEND_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthProvider";
import { SiteHeader } from "@/components/site-header";

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

    // Auth guard
    useEffect(() => {
        if (!authLoading && !accessToken) {
            router.push("/signin");
        }
    }, [authLoading, accessToken, router]);

    // Fetch challenge
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

    // Submit solution
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
                } else {
                    router.replace(`/contest/${contestId}/finalpage`);
                }
            }, 15000);
        } catch (err: any) {
            alert(err?.response?.data?.message || "Submission failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <p className="p-6 text-muted-foreground">Loading...</p>;
    }

    if (!challenge) {
        return <p className="p-6 text-red-500">Challenge not found</p>;
    }

    return (
        <>
            <SiteHeader />
            <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
                <h1 className="text-2xl font-semibold">{challenge.title}</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>Problem</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                            {challenge.description}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Your Submission</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Write your solution here..."
                            className="font-mono min-h-75"
                        />

                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || !code.trim()}
                        >
                            {submitting ? "Submitting..." : "Submit"}
                        </Button>
                    </CardContent>
                </Card>

                {result && (
                    <Card>
                        <CardContent className="pt-4 space-y-2">
                            <p>
                                <strong>Verdict:</strong> {result.verdict}
                            </p>
                            <p>
                                <strong>Marks:</strong> {result.marks} /{" "}
                                {challenge.maxPoints}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {result.reason}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </main>
        </>
    );
}
