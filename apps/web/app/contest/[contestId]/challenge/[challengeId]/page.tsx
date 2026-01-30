"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

import { BACKEND_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthProvider";

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
};

export default function ChallengePage() {
    const params = useParams();
    const router = useRouter();

    const { accessToken, loading: authLoading } = useAuth();

    const contestId = params?.contestId as string;
    const challengeId = params?.challengeId as string;

    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [loading, setLoading] = useState(true);
    const [lang, setLang] = useState("typescript");
    const [code, setCode] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // 🔐 Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !accessToken) {
            router.push("/signin");
        }
    }, [authLoading, accessToken, router]);

    const fetchChallenge = async () => {
        try {
            const res = await axios.get(
                `${BACKEND_URL}/api/v1/contest/${contestId}/challenge/${challengeId}`,
                { withCredentials: true }
            );

            setChallenge(res.data.data.challenge);
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
        if (!accessToken || authLoading) return;
        if (!code.trim()) return;

        try {
            setSubmitting(true);

            await axios.post(
                `${BACKEND_URL}/api/v1/contest/${contestId}/challenge/${challengeId}/submit`,
                {
                    submission: code,
                    points: 30,
                    language: lang,
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    withCredentials: true,
                }
            );

            alert("Submitted successfully");
            router.push("/finalpage");
        } catch (error) {
            console.error("Submission failed:", error);
            alert("Submission failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <p className="p-6 text-muted-foreground">Loading challenge...</p>
        );
    }

    if (!challenge) {
        return (
            <p className="p-6 text-red-500">Challenge not found.</p>
        );
    }

    return (
        <main className="mx-auto max-w-5xl px-4 py-6 md:py-8">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold">{challenge.title}</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Problem */}
                <Card>
                    <CardHeader>
                        <CardTitle>Problem Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            {challenge.description}
                        </p>
                    </CardContent>
                </Card>

                {/* Solution */}
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle>Your Solution</CardTitle>

                        <Select value={lang} onValueChange={setLang}>
                            <SelectTrigger className="h-8 w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="typescript">TypeScript</SelectItem>
                                <SelectItem value="javascript">JavaScript</SelectItem>
                                <SelectItem value="python">Python</SelectItem>
                                <SelectItem value="go">Go</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>

                    <CardContent className="space-y-3">
                        <Textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            rows={16}
                            className="font-mono text-sm"
                        />

                        <Button
                            onClick={handleSubmit}
                            disabled={
                                submitting ||
                                authLoading ||
                                !accessToken ||
                                !code.trim()
                            }
                        >
                            {submitting ? "Submitting..." : "Submit"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
