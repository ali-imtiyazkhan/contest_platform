"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { BACKEND_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

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

const router = useRouter();

export default function ChallengePage() {
    const params = useParams();
    const contestId = params?.contestId as string;
    const challengeId = params?.challengeId as string;

    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [loading, setLoading] = useState(true);

    const [lang, setLang] = useState("typescript");
    const [code, setCode] = useState("");
    const [submitting, setSubmitting] = useState(false);


    const handleSubmit = async () => {
        if (!code.trim()) return;

        try {
            setSubmitting(true);

            await axios.post(
                `${BACKEND_URL}/api/v1/contest/${contestId}/challenge/${challengeId}/submit`,
                {
                    submission: code,
                    points: 0,
                },
                { withCredentials: true }
            );

            router.push("/finalpage")
            alert("Submitted successfully");
        } catch (err) {
            console.error(err);
            alert("Submission failed");
        } finally {
            setSubmitting(false);
        }
    };

    // Timer
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setElapsed((s) => s + 1), 1000);
        return () => clearInterval(t);
    }, []);
    const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const ss = String(elapsed % 60).padStart(2, "0");

    // router:contestId/challenge/:challengeId
    const fetchChallenge = async () => {
        try {
            const res = await axios.get(
                `${BACKEND_URL}/api/v1/contest/${contestId}/challenge/${challengeId}`,
                { withCredentials: true }
            );
            setChallenge(res.data.data); setChallenge(res.data.data.challenge);

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

    if (loading) {
        return (
            <p className="p-6 text-muted-foreground">
                Loading challenge...
            </p>
        );
    }

    if (!challenge) {
        return (
            <p className="p-6 text-red-500">
                Challenge not found.
            </p>
        );
    }

    return (
        <main className="mx-auto max-w-5xl px-4 py-6 md:py-8">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-pretty text-xl font-semibold md:text-2xl">
                    {challenge.title}
                </h1>

                <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium">
                    {mm}:{ss}
                </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Left */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Problem Description
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            {challenge.description}
                        </p>
                    </CardContent>
                </Card>

                {/* Right */}
                <Card>
                    <CardHeader className="flex items-center justify-between gap-3">
                        <CardTitle className="text-base">
                            Your solution
                        </CardTitle>

                        <Select value={lang} onValueChange={setLang}>
                            <SelectTrigger className="h-8 w-40">
                                <SelectValue placeholder="Language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="typescript">
                                    TypeScript
                                </SelectItem>
                                <SelectItem value="javascript">
                                    JavaScript
                                </SelectItem>
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
                            placeholder="Paste your solution here"
                        />

                        <div className="flex items-center gap-3">
                            <Button
                                disabled={submitting || code.trim().length === 0}
                                onClick={() => {
                                    setSubmitting(true);
                                    setTimeout(() => setSubmitting(false), 900);
                                    handleSubmit()
                                }}
                            >
                                {submitting ? "Submitting..." : "Submit"}
                            </Button>

                            <Button
                                variant="secondary"
                                onClick={() => setCode("")}
                            >
                                Clear
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
