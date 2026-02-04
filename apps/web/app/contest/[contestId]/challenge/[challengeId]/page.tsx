"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

import { BACKEND_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthProvider";
import { SiteHeader } from "@/components/site-header";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Challenge = {
    id: string;
    title: string;
    description: string;
    maxPoints: number;

};

const SUPPORTED_LANGUAGES = [
    { label: "TypeScript", value: "typescript" },
    { label: "JavaScript", value: "javascript" },
    { label: "Python", value: "python" },
    { label: "Go", value: "go" },
];

export default function ChallengePage() {
    const params = useParams();
    const router = useRouter();
    const { accessToken, loading: authLoading } = useAuth();

    const contestId = params?.contestId as string;
    const challengeId = params?.challengeId as string;

    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [loading, setLoading] = useState(true);
    const [lang, setLang] = useState(SUPPORTED_LANGUAGES[0].value);
    const [code, setCode] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!authLoading && !accessToken) {
            router.push("/signin");
        }
    }, [authLoading, accessToken, router]);

    const fetchChallenge = async () => {
        try {
            setLoading(true);

            const res = await axios.get(
                `${BACKEND_URL}/api/v1/contest/${contestId}/challenge/${challengeId}`,
                { withCredentials: true }
            );

            setChallenge(res.data.data.challenge);
            setCode("");
        } catch (error) {
            console.error("Failed to load challenge:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (contestId && challengeId) {
            fetchChallenge();
        }
    }, [contestId, challengeId]);

    const handleSubmit = async () => {
        if (!accessToken || authLoading || !challenge) return;
        if (!code.trim()) return;

        try {
            setSubmitting(true);

            const res = await axios.post(
                `${BACKEND_URL}/api/v1/contest/${contestId}/challenge/${challengeId}/submit`,
                {
                    submission: code,
                    points: challenge.maxPoints,
                    language: lang,
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    withCredentials: true,
                }
            );

            const nextId = res.data.nextChallengeId;
            console.log("next challenge id is : ", nextId);

            if (nextId) {
                router.replace(`/contest/${contestId}/challenge/${nextId}`);
            } else {
                router.replace(`/contest/${contestId}/finalpage`);
            }
        } catch (error) {
            console.error("Submission failed:", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <p className="p-6 text-muted-foreground">Loading challenge...</p>;
    }

    if (!challenge) {
        return <p className="p-6 text-red-500">Challenge not found.</p>;
    }

    return (

        <div>
            <div><SiteHeader /></div>
            <main className="mx-auto max-w-6xl px-6 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">{challenge.title}</h1>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                    {/* Problem */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Problem Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {challenge.description}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Solution */}
                    <Card className="flex flex-col">
                        <CardHeader className="flex items-center justify-between">
                            <CardTitle>Your Solution</CardTitle>

                            <Select value={lang} onValueChange={setLang}>
                                <SelectTrigger className="h-8 w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SUPPORTED_LANGUAGES.map((l) => (
                                        <SelectItem key={l.value} value={l.value}>
                                            {l.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardHeader>

                        <CardContent className="flex flex-col gap-4 flex-1">
                            <Textarea
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="font-mono text-sm flex-1 min-h-75"
                                placeholder="Write your solution here..."
                            />

                            <Button
                            className="cursor-pointer"
                                onClick={handleSubmit}
                                disabled={
                                    submitting || authLoading || !accessToken || !code.trim()
                                }
                            >
                                {submitting ? "Submitting..." : "Submit"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
