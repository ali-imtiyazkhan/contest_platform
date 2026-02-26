"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Crown, Timer, Hash, Activity, Zap } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

interface Entry {
    userId: string;
    score: number;
    email: string;
}

export default function Leaderboard({ contestId }: { contestId: string }) {
    const { theme } = useTheme();
    const [data, setData] = useState<Entry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/contest/${contestId}/leaderboard`
            );
            const json = await res.json();
            const sortedData = (json.leaderboard || []).sort((a: Entry, b: Entry) => b.score - a.score);
            setData(sortedData);
        } catch (e) {
            console.error("Failed to fetch leaderboard:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 5000);
        return () => clearInterval(interval);
    }, [contestId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col justify-center items-center gap-4">
                <div className="relative h-16 w-16">
                    <div className="absolute inset-0 rounded-full border-2 border-[var(--border-secondary)]"></div>
                    <div className="absolute inset-0 rounded-full border-t-2 border-[var(--accent)] animate-spin"></div>
                </div>
                <p className="text-[var(--text-muted)] font-mono text-xs animate-pulse font-bold tracking-widest uppercase">SYNCHRONIZING_RANKS...</p>
            </div>
        );
    }

    const podium = data.slice(0, 3);
    const remainder = data.slice(3);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent-bg)]">
            <SiteHeader />

            <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[var(--accent)] font-mono text-[10px] tracking-[0.3em] uppercase">
                            <Activity size={14} className="animate-pulse" />
                            <span>Live_Arena_Feed</span>
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter italic text-[var(--text-primary)]">
                            RANKINGS
                        </h1>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest">Contestants</p>
                            <p className="text-2xl font-mono font-black text-[var(--text-primary)]">{data.length}</p>
                        </div>
                        <div className="w-px h-10 bg-[var(--border-primary)]" />
                        <div className="bg-[var(--bg-card)] px-4 py-2 rounded-lg border border-[var(--border-secondary)] flex items-center gap-3">
                            <Hash className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-xs font-mono text-[var(--text-muted)]">{contestId.slice(0, 8)}</span>
                        </div>
                    </div>
                </div>

                {/* PODIUM SECTION */}
                {data.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-10">
                        {/* 2nd Place */}
                        <div className="order-2 md:order-1">
                            {podium[1] && <PodiumCard entry={podium[1]} rank={2} color="text-[var(--text-muted)]" bgColor="bg-[var(--bg-card)]" borderColor="border-[var(--border-secondary)]" />}
                        </div>
                        {/* 1st Place */}
                        <div className="order-1 md:order-2">
                            {podium[0] && <PodiumCard entry={podium[0]} rank={1} color="text-[var(--accent)]" bgColor="bg-[var(--accent-bg)]" borderColor="border-[var(--accent-border)]" isLarge />}
                        </div>
                        {/* 3rd Place */}
                        <div className="order-3 md:order-3">
                            {podium[2] && <PodiumCard entry={podium[2]} rank={3} color="text-orange-500" bgColor="bg-orange-500/10" borderColor="border-orange-500/20" />}
                        </div>
                    </div>
                )}

                {/* REMAINDER LIST */}
                <div className="space-y-2">
                    <div className="grid grid-cols-12 px-6 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                        <div className="col-span-1">Pos</div>
                        <div className="col-span-8 md:col-span-9">Combatant</div>
                        <div className="col-span-3 md:col-span-2 text-right">Score</div>
                    </div>

                    <AnimatePresence mode="popLayout">
                        {remainder.map((entry, index) => (
                            <motion.div
                                layout
                                key={entry.userId}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="grid grid-cols-12 items-center px-6 py-4 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-xl hover:border-[var(--accent-border)] transition-colors group"
                            >
                                <div className="col-span-1 font-mono text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                                    #{index + 4}
                                </div>
                                <div className="col-span-8 md:col-span-9 flex flex-col">
                                    <span className="font-bold text-[var(--text-primary)] opacity-90 uppercase tracking-tight">
                                        {entry.email.split('@')[0]}
                                    </span>
                                    <span className="text-[10px] font-mono text-[var(--text-muted)] truncate max-w-37.5 md:max-w-none">
                                        UID: {entry.userId.slice(-12)}
                                    </span>
                                </div>
                                <div className="col-span-3 md:col-span-2 text-right font-mono font-black text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                                    {entry.score.toLocaleString()}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

function PodiumCard({ entry, rank, color, bgColor, borderColor, isLarge = false }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "relative flex flex-col items-center p-8 rounded-4xl border text-center transition-all duration-500",
                bgColor, borderColor,
                isLarge ? "scale-110 md:-translate-y-8 z-10 shadow-[0_0_50px_-15px_rgba(234,179,8,0.3)]" : "scale-100 opacity-80"
            )}
        >
            <div className={cn(
                "p-4 rounded-2xl mb-4 border",
                borderColor, "bg-[var(--bg-primary)] opacity-40"
            )}>
                {rank === 1 ? <Crown className={color} size={32} /> : <Trophy className={color} size={24} />}
            </div>

            <div className="flex flex-col mb-4">
                <span className={cn("font-black tracking-tighter uppercase truncate max-w-35 text-[var(--text-primary)]", isLarge ? "text-2xl" : "text-lg")}>
                    {entry.email.split('@')[0]}
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Rank {rank}</span>
            </div>

            <div className="flex flex-col items-center">
                <div className={cn("font-black font-mono tracking-tight", isLarge ? "text-4xl" : "text-2xl", color)}>
                    {entry.score.toLocaleString()}
                </div>
                <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mt-1">Points</div>
            </div>

            {isLarge && (
                <div className="absolute -bottom-3 bg-[var(--accent)] text-[var(--accent-text-on)] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                    Arena_Master
                </div>
            )}
        </motion.div>
    );
}