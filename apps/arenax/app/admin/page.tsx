"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, Reorder } from "framer-motion";
import {
    Plus,
    Trash2,
    ShieldCheck,
    Zap,
    Loader2,
    Clock,
    Settings2,
    GripVertical,
    Save,
    Eye,
    Calendar,
    Award,
    Users,
    Target,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";

import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/hooks/use-toast";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

type Difficulty = "Beginner" | "Intermediate" | "Advanced" | "Elite";
type ContestCategory = "MATH" | "WRITING" | "GENERAL_KNOWLEDGE" | "TECH";

interface Challenge {
    id: string;
    title: string;
    description: string;
    question: string;
    hint: string;
    maxPoints: number;
    duration: number; // in seconds
    type: Difficulty;
}

interface ContestForm {
    title: string;
    description: string;
    category: ContestCategory;
    difficulty: Difficulty;
    prize: number;
    maxParticipants: number;
    host: string;
    tags: string[];
    startTime: string;
    endTime: string;
    scheduled: boolean;
}

export default function AdminPage() {
    const { toast } = useToast();
    const { accessToken, user, authReady } = useAuth();

    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [tagInput, setTagInput] = useState("");

    const [form, setForm] = useState<ContestForm>({
        title: "",
        description: "",
        category: "GENERAL_KNOWLEDGE",
        difficulty: "Intermediate",
        prize: 1000,
        maxParticipants: 1000,
        host: "ArenaX Official",
        tags: [],
        startTime: "",
        endTime: "",
        scheduled: false,
    });

    const [challenges, setChallenges] = useState<Challenge[]>([
        {
            id: "temp-1",
            title: "",
            description: "",
            question: "",
            hint: "",
            maxPoints: 100,
            duration: 300,
            type: "Beginner",
        },
    ]);

    useEffect(() => {

        if (!authReady) return;

        if (!accessToken || user?.role !== "Admin") {
            router.push("/signin");
        }

    }, [authReady, accessToken, user]);


    const updateForm = (field: keyof ContestForm, value: any) => {
        setForm((f) => ({ ...f, [field]: value }));
    };

    const addChallenge = () => {
        setChallenges((c) => [
            ...c,
            {
                id: `temp-${Date.now()}`,
                title: "",
                description: "",
                question: "",
                hint: "",
                maxPoints: 100,
                duration: 300,
                type: "Beginner",
            },
        ]);
    };

    const removeChallenge = (id: string) => {
        setChallenges((c) => c.filter((ch) => ch.id !== id));
    };

    const updateChallenge = (id: string, field: keyof Challenge, value: any) => {
        setChallenges((c) =>
            c.map((ch) => (ch.id === id ? { ...ch, [field]: value } : ch))
        );
    };

    const addTag = () => {
        if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
            updateForm("tags", [...form.tags, tagInput.trim()]);
            setTagInput("");
        }
    };

    const removeTag = (tag: string) => {
        updateForm(
            "tags",
            form.tags.filter((t) => t !== tag)
        );
    };

    const validateForm = (): string | null => {
        if (!form.title.trim()) return "Contest title is required";
        if (!form.description.trim()) return "Contest description is required";
        if (challenges.length === 0) return "At least one challenge is required";

        for (let i = 0; i < challenges.length; i++) {
            const ch = challenges[i];
            if (!ch.title.trim()) return `Challenge ${i + 1}: Title is required`;
            if (!ch.question.trim()) return `Challenge ${i + 1}: Question is required`;
            if (ch.maxPoints <= 0) return `Challenge ${i + 1}: Points must be > 0`;
            if (ch.duration <= 0) return `Challenge ${i + 1}: Duration must be > 0`;
        }

        if (form.scheduled) {
            if (!form.startTime || !form.endTime)
                return "Start and end times are required";
            if (new Date(form.startTime) >= new Date(form.endTime))
                return "End time must be after start time";
        }

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const error = validateForm();
        if (error) {
            toast({
                title: "❌ Validation Failed",
                description: error,
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            // 1. Create contest
            const contestRes = await fetch(`${API_BASE}/api/v1/contest/admin/contest`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    title: form.title,
                    description: form.description,
                    category: form.category,
                    difficulty: form.difficulty,
                    prize: form.prize,
                    maxParticipants: form.maxParticipants,
                    host: form.host,
                    tags: form.tags,
                    startTime: form.scheduled
                        ? new Date(form.startTime).toISOString()
                        : new Date().toISOString(),
                    endTime: form.scheduled
                        ? new Date(form.endTime).toISOString()
                        : new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                }),
            });

            const contestData = await contestRes.json();
            if (!contestRes.ok || !contestData.ok) {
                throw new Error("Failed to create contest");
            }

            const contestId = contestData.contest.id;

            // 2. Create challenges and link them
            for (let i = 0; i < challenges.length; i++) {
                const ch = challenges[i];

                const challengeRes = await fetch(
                    `${API_BASE}/api/v1/contest/admin/challenge`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${accessToken}`,
                        },
                        body: JSON.stringify({
                            title: ch.title,
                            description: ch.description,
                            question: ch.question,
                            hint: ch.hint,
                            maxPoints: ch.maxPoints,
                            duration: ch.duration,
                            type: ch.type,
                        }),
                    }
                );

                const challengeData = await challengeRes.json();
                if (!challengeRes.ok || !challengeData.ok) {
                    throw new Error(`Failed to create challenge: ${ch.title}`);
                }

                // Link challenge to contest
                await fetch(
                    `${API_BASE}/api/v1/contest/admin/contest/${contestId}/challenge`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${accessToken}`,
                        },
                        body: JSON.stringify({
                            challengeId: challengeData.challenge.id,
                            index: i,
                        }),
                    }
                );
            }

            toast({
                title: "🎉 Contest Published!",
                description: `"${form.title}" is now live`,
            });

            // Reset form
            setForm({
                title: "",
                description: "",
                category: "GENERAL_KNOWLEDGE",
                difficulty: "Intermediate",
                prize: 1000,
                maxParticipants: 1000,
                host: "ArenaX Official",
                tags: [],
                startTime: "",
                endTime: "",
                scheduled: false,
            });
            setChallenges([
                {
                    id: "temp-1",
                    title: "",
                    description: "",
                    question: "",
                    hint: "",
                    maxPoints: 100,
                    duration: 300,
                    type: "Beginner",
                },
            ]);

            router.push("/contests");
        } catch (err: any) {
            toast({
                title: "❌ Deployment Failed",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (!accessToken || user?.role !== "Admin") {
        return null;
    }

    const totalPoints = challenges.reduce((sum, ch) => sum + ch.maxPoints, 0);
    const totalDuration = challenges.reduce((sum, ch) => sum + ch.duration, 0);

    return (
        <div
            className="min-h-screen bg-[#0a0a0a] text-cream"
            style={{ fontFamily: "'Syne', sans-serif" }}
        >
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/80 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-acid/10 border border-acid/30 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-acid" />
                        </div>
                        <div>
                            <h1
                                className="text-2xl font-extrabold tracking-tight"
                                style={{ fontFamily: "'Bebas Neue', cursive" }}
                            >
                                Admin Control Center
                            </h1>
                            <p className="text-[0.7rem] text-muted font-mono tracking-widest uppercase">
                                Contest Management Portal
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setPreviewMode(!previewMode)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.1] text-sm font-semibold hover:bg-white/[0.05] transition-colors"
                        >
                            <Eye className="w-4 h-4" />
                            {previewMode ? "Edit Mode" : "Preview"}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !form.title}
                            className="flex items-center gap-2 bg-acid text-black px-6 py-2 rounded-lg font-extrabold text-sm tracking-[2px] uppercase hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-acid/20"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Publishing...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4" />
                                    Publish Contest
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-4 gap-4">
                    {[
                        {
                            icon: Target,
                            label: "Challenges",
                            value: challenges.length,
                            color: "text-acid",
                        },
                        {
                            icon: Award,
                            label: "Total Points",
                            value: totalPoints,
                            color: "text-orange",
                        },
                        {
                            icon: Clock,
                            label: "Total Duration",
                            value: `${Math.floor(totalDuration / 60)}m`,
                            color: "text-emerald-400",
                        },
                        {
                            icon: Users,
                            label: "Max Participants",
                            value: form.maxParticipants,
                            color: "text-blue-400",
                        },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                <span
                                    className={`font-extrabold text-2xl ${stat.color}`}
                                    style={{ fontFamily: "'Bebas Neue', cursive" }}
                                >
                                    {stat.value}
                                </span>
                            </div>
                            <p className="text-[0.7rem] text-muted font-mono tracking-widest uppercase">
                                {stat.label}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Contest Configuration */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#111113]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Settings2 className="w-5 h-5 text-acid" />
                        <h2
                            className="text-xl font-extrabold"
                            style={{ fontFamily: "'Bebas Neue', cursive" }}
                        >
                            Contest Configuration
                        </h2>
                    </div>

                    <div className="space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="block font-mono text-[0.7rem] text-muted tracking-[2px] uppercase">
                                Contest Title *
                            </label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => updateForm("title", e.target.value)}
                                placeholder="Logic Masters Invitational"
                                className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-3 text-cream text-sm outline-none focus:border-acid/50 transition-all placeholder:text-muted/40"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="block font-mono text-[0.7rem] text-muted tracking-[2px] uppercase">
                                Description *
                            </label>
                            <textarea
                                value={form.description}
                                onChange={(e) => updateForm("description", e.target.value)}
                                placeholder="A competitive arena testing mathematical reasoning and problem-solving skills..."
                                rows={3}
                                className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-3 text-cream text-sm outline-none focus:border-acid/50 transition-all placeholder:text-muted/40 resize-none"
                            />
                        </div>

                        {/* Row 1: Category, Difficulty, Prize */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="block font-mono text-[0.7rem] text-muted tracking-[2px] uppercase">
                                    Category
                                </label>
                                <select
                                    value={form.category}
                                    onChange={(e) =>
                                        updateForm("category", e.target.value as ContestCategory)
                                    }
                                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-3 text-cream text-sm outline-none focus:border-acid/50 transition-all"
                                >
                                    <option value="MATH">Math & Logic</option>
                                    <option value="WRITING">Writing</option>
                                    <option value="GENERAL_KNOWLEDGE">General Knowledge</option>
                                    <option value="TECH">Tech & Coding</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block font-mono text-[0.7rem] text-muted tracking-[2px] uppercase">
                                    Difficulty
                                </label>
                                <select
                                    value={form.difficulty}
                                    onChange={(e) =>
                                        updateForm("difficulty", e.target.value as Difficulty)
                                    }
                                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-3 text-cream text-sm outline-none focus:border-acid/50 transition-all"
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                    <option value="Elite">Elite</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block font-mono text-[0.7rem] text-muted tracking-[2px] uppercase">
                                    Prize Pool ($)
                                </label>
                                <input
                                    type="number"
                                    value={form.prize}
                                    onChange={(e) => updateForm("prize", Number(e.target.value))}
                                    min={0}
                                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-3 text-cream text-sm outline-none focus:border-acid/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Row 2: Max Participants, Host */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block font-mono text-[0.7rem] text-muted tracking-[2px] uppercase">
                                    Max Participants
                                </label>
                                <input
                                    type="number"
                                    value={form.maxParticipants}
                                    onChange={(e) =>
                                        updateForm("maxParticipants", Number(e.target.value))
                                    }
                                    min={1}
                                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-3 text-cream text-sm outline-none focus:border-acid/50 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block font-mono text-[0.7rem] text-muted tracking-[2px] uppercase">
                                    Host Organization
                                </label>
                                <input
                                    type="text"
                                    value={form.host}
                                    onChange={(e) => updateForm("host", e.target.value)}
                                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-3 text-cream text-sm outline-none focus:border-acid/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="space-y-2">
                            <label className="block font-mono text-[0.7rem] text-muted tracking-[2px] uppercase">
                                Tags
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                                    placeholder="Add tag..."
                                    className="flex-1 bg-black/40 border border-white/[0.08] rounded-lg px-4 py-2 text-cream text-sm outline-none focus:border-acid/50 transition-all placeholder:text-muted/40"
                                />
                                <button
                                    onClick={addTag}
                                    className="px-4 py-2 bg-acid/10 border border-acid/30 rounded-lg text-acid font-semibold text-sm hover:bg-acid/20 transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex gap-2 flex-wrap mt-2">
                                {form.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.05] border border-white/[0.08] rounded-full text-[0.75rem] text-cream"
                                    >
                                        {tag}
                                        <button
                                            onClick={() => removeTag(tag)}
                                            className="hover:text-red-400 transition-colors"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Scheduling */}
                        <div className="border-t border-white/[0.06] pt-6">
                            <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-acid" />
                                    <div>
                                        <p className="font-semibold text-sm">Enable Scheduling</p>
                                        <p className="text-[0.7rem] text-muted">
                                            Set custom start and end times
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => updateForm("scheduled", !form.scheduled)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${form.scheduled ? "bg-acid" : "bg-white/[0.1]"
                                        }`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-black rounded-full transition-transform ${form.scheduled ? "translate-x-6" : ""
                                            }`}
                                    />
                                </button>
                            </div>

                            {form.scheduled && (
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="space-y-2">
                                        <label className="block font-mono text-[0.7rem] text-muted tracking-[2px] uppercase">
                                            Start Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={form.startTime}
                                            onChange={(e) => updateForm("startTime", e.target.value)}
                                            className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-3 text-cream text-sm outline-none focus:border-acid/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block font-mono text-[0.7rem] text-muted tracking-[2px] uppercase">
                                            End Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={form.endTime}
                                            onChange={(e) => updateForm("endTime", e.target.value)}
                                            className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-3 text-cream text-sm outline-none focus:border-acid/50 transition-all"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Challenges Section */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <h2
                                className="text-2xl font-extrabold"
                                style={{ fontFamily: "'Bebas Neue', cursive" }}
                            >
                                Challenges
                            </h2>
                            <span className="px-3 py-1 bg-acid/10 border border-acid/30 rounded-full text-acid font-mono text-sm font-bold">
                                {challenges.length}
                            </span>
                        </div>
                        <button
                            onClick={addChallenge}
                            className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-sm font-semibold hover:bg-white/[0.08] transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Challenge
                        </button>
                    </div>

                    <Reorder.Group
                        axis="y"
                        values={challenges}
                        onReorder={setChallenges}
                        className="space-y-4"
                    >
                        {challenges.map((ch, idx) => (
                            <Reorder.Item key={ch.id} value={ch}>
                                <motion.div
                                    layout
                                    className="bg-[#111113]/80 backdrop-blur-xl border border-white/[0.08] rounded-xl p-6 hover:border-white/[0.12] transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <GripVertical className="w-5 h-5 text-muted cursor-grab active:cursor-grabbing" />
                                            <div className="w-10 h-10 rounded-lg bg-acid/10 border border-acid/30 flex items-center justify-center">
                                                <span
                                                    className="text-acid font-extrabold"
                                                    style={{ fontFamily: "'Bebas Neue', cursive" }}
                                                >
                                                    {idx + 1}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            {/* Title */}
                                            <input
                                                type="text"
                                                value={ch.title}
                                                onChange={(e) =>
                                                    updateChallenge(ch.id, "title", e.target.value)
                                                }
                                                placeholder="Challenge Title *"
                                                className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-2.5 text-cream text-sm font-semibold outline-none focus:border-acid/50 transition-all placeholder:text-muted/40"
                                            />

                                            {/* Description */}
                                            <input
                                                type="text"
                                                value={ch.description}
                                                onChange={(e) =>
                                                    updateChallenge(ch.id, "description", e.target.value)
                                                }
                                                placeholder="Brief description"
                                                className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-2.5 text-cream text-sm outline-none focus:border-acid/50 transition-all placeholder:text-muted/40"
                                            />

                                            {/* Question */}
                                            <textarea
                                                value={ch.question}
                                                onChange={(e) =>
                                                    updateChallenge(ch.id, "question", e.target.value)
                                                }
                                                placeholder="Question text (supports multi-line) *"
                                                rows={3}
                                                className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-2.5 text-cream text-sm outline-none focus:border-acid/50 transition-all placeholder:text-muted/40 resize-none"
                                            />

                                            {/* Hint */}
                                            <input
                                                type="text"
                                                value={ch.hint}
                                                onChange={(e) =>
                                                    updateChallenge(ch.id, "hint", e.target.value)
                                                }
                                                placeholder="Hint (optional)"
                                                className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-2.5 text-cream text-sm outline-none focus:border-acid/50 transition-all placeholder:text-muted/40"
                                            />

                                            {/* Grid: Points, Duration, Difficulty */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="space-y-1">
                                                    <label className="block font-mono text-[0.65rem] text-muted tracking-[2px] uppercase">
                                                        Points
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={ch.maxPoints}
                                                        onChange={(e) =>
                                                            updateChallenge(
                                                                ch.id,
                                                                "maxPoints",
                                                                Number(e.target.value)
                                                            )
                                                        }
                                                        min={1}
                                                        className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-cream text-sm outline-none focus:border-acid/50 transition-all"
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="block font-mono text-[0.65rem] text-muted tracking-[2px] uppercase">
                                                        Duration (sec)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={ch.duration}
                                                        onChange={(e) =>
                                                            updateChallenge(
                                                                ch.id,
                                                                "duration",
                                                                Number(e.target.value)
                                                            )
                                                        }
                                                        min={1}
                                                        className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-cream text-sm outline-none focus:border-acid/50 transition-all"
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="block font-mono text-[0.65rem] text-muted tracking-[2px] uppercase">
                                                        Difficulty
                                                    </label>
                                                    <select
                                                        value={ch.type}
                                                        onChange={(e) =>
                                                            updateChallenge(
                                                                ch.id,
                                                                "type",
                                                                e.target.value as Difficulty
                                                            )
                                                        }
                                                        className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-cream text-sm outline-none focus:border-acid/50 transition-all"
                                                    >
                                                        <option value="Beginner">Beginner</option>
                                                        <option value="Intermediate">Intermediate</option>
                                                        <option value="Advanced">Advanced</option>
                                                        <option value="Elite">Elite</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => removeChallenge(ch.id)}
                                            className="flex-shrink-0 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </motion.div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                </div>

                {/* Validation Alert */}
                {(() => {
                    const error = validateForm();
                    if (error) {
                        return (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-3 bg-orange/10 border border-orange/30 rounded-xl p-4"
                            >
                                <AlertCircle className="w-5 h-5 text-orange flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-sm text-orange">
                                        Validation Error
                                    </p>
                                    <p className="text-[0.8rem] text-orange/80 mt-1">{error}</p>
                                </div>
                            </motion.div>
                        );
                    } else {
                        return (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-3 bg-acid/10 border border-acid/30 rounded-xl p-4"
                            >
                                <CheckCircle2 className="w-5 h-5 text-acid flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-sm text-acid">
                                        Ready to Publish
                                    </p>
                                    <p className="text-[0.8rem] text-cream/70 mt-1">
                                        All validation checks passed. Your contest is ready to go
                                        live.
                                    </p>
                                </div>
                            </motion.div>
                        );
                    }
                })()}
            </main>
        </div>
    );
}