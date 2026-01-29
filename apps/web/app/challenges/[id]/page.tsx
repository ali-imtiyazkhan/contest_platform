"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { BACKEND_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

type Challenge = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  topic: string;
  requirements: string[];
  tasks: string[];
};

export default function ChallengePage() {
  const params = useParams();
  const id = params?.id as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  const [lang, setLang] = useState("typescript");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ⏱ Timer
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");


  const fetchChallenge = async () => {
    try {
      const res = await axios.get(
        `${BACKEND_URL}/api/v1/challenge/${id}`,
        { withCredentials: true }
      );
      setChallenge(res.data.data);
    } catch (error) {
      console.error("Failed to load challenge:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchChallenge();
  }, [id]);

  const checked = useMemo(
    () => new Array(challenge?.tasks.length ?? 0).fill(false),
    [challenge]
  );
  const [checkedState, setCheckedState] = useState<boolean[]>([]);

  useEffect(() => {
    if (challenge) {
      setCheckedState(new Array(challenge.tasks.length).fill(false));
    }
  }, [challenge]);

  const score = checkedState.filter(Boolean).length * 2;

  const toggle = (idx: number, value: boolean) =>
    setCheckedState((arr) =>
      arr.map((v, i) => (i === idx ? value : v))
    );

  if (loading) {
    return <p className="p-6 text-muted-foreground">Loading challenge...</p>;
  }

  if (!challenge) {
    return <p className="p-6 text-red-500">Challenge not found.</p>;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-pretty text-xl font-semibold tracking-tight md:text-2xl">
          {challenge.title}
        </h1>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-muted px-2 py-1 text-xs">
            {challenge.difficulty}
          </span>
          <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium">
            {mm}:{ss}
          </span>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Topic: <span className="font-medium">{challenge.topic}</span>
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left */}
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Problem</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">
              {challenge.description}
            </p>

            {/* Requirements */}
            <div className="grid gap-2">
              <h2 className="text-sm font-semibold">Requirements</h2>
              <ul className="ms-5 list-disc text-sm text-muted-foreground">
                {challenge.requirements.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            {/* Checklist */}
            <div className="grid gap-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold">Checklist</h2>
                <span className="text-xs text-muted-foreground">
                  Score:{" "}
                  <span className="font-medium">{score}</span>/10
                </span>
              </div>

              <div className="grid gap-2">
                {challenge.tasks.map((t, i) => (
                  <label
                    key={i}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={checkedState[i]}
                      onCheckedChange={(v) =>
                        toggle(i, Boolean(v))
                      }
                    />
                    <span className="text-sm">{t}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right */}
        <Card className="h-full">
          <CardHeader className="flex items-center justify-between gap-3 pb-2">
            <CardTitle className="text-base">Your solution</CardTitle>

            <Select value={lang} onValueChange={setLang}>
              <SelectTrigger className="h-8 w-40">
                <SelectValue placeholder="Language" />
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
            <Label className="text-xs text-muted-foreground">
              Paste your code
            </Label>

            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={18}
              className="font-mono text-sm"
              placeholder="// Paste your solution here"
            />

            <div className="flex items-center gap-3">
              <Button
                disabled={submitting || code.trim().length === 0}
                onClick={() => {
                  setSubmitting(true);
                  setTimeout(() => setSubmitting(false), 900);
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
