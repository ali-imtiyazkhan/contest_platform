"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Crown, Timer, Hash, Activity, Zap } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

interface Entry {
    userId: string;
    score: number;
    email: string;
}

export default function Leaderboard({ contestId }: { contestId: string }) {
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
            <div className="min-h-screen bg-black flex flex-col justify-center items-center gap-4">
                <div className="relative h-16 w-16">
                    <div className="absolute inset-0 rounded-full border-2 border-zinc-900"></div>
                    <div className="absolute inset-0 rounded-full border-t-2 border-yellow-500 animate-spin"></div>
                </div>
                <p className="text-zinc-500 font-mono text-xs animate-pulse">SYNCHRONIZING_RANKS...</p>
            </div>
        );
    }

    const podium = data.slice(0, 3);
    const remainder = data.slice(3);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-yellow-500/30">
            <SiteHeader />

            <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-yellow-500 font-mono text-[10px] tracking-[0.3em] uppercase">
                            <Activity size={14} className="animate-pulse" />
                            <span>Live_Arena_Feed</span>
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter italic">
                            RANKINGS
                        </h1>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Contestants</p>
                            <p className="text-2xl font-mono font-black">{data.length}</p>
                        </div>
                        <div className="w-px h-10 bg-zinc-800" />
                        <div className="bg-zinc-900/50 px-4 py-2 rounded-lg border border-zinc-800 flex items-center gap-3">
                            <Hash className="w-4 h-4 text-zinc-600" />
                            <span className="text-xs font-mono text-zinc-400">{contestId.slice(0, 8)}</span>
                        </div>
                    </div>
                </div>

                {/* PODIUM SECTION */}
                {data.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-10">
                        {/* 2nd Place */}
                        <div className="order-2 md:order-1">
                            {podium[1] && <PodiumCard entry={podium[1]} rank={2} color="text-zinc-400" bgColor="bg-zinc-400/10" borderColor="border-zinc-400/20" />}
                        </div>
                        {/* 1st Place */}
                        <div className="order-1 md:order-2">
                            {podium[0] && <PodiumCard entry={podium[0]} rank={1} color="text-yellow-500" bgColor="bg-yellow-500/10" borderColor="border-yellow-500/30" isLarge />}
                        </div>
                        {/* 3rd Place */}
                        <div className="order-3 md:order-3">
                            {podium[2] && <PodiumCard entry={podium[2]} rank={3} color="text-orange-500" bgColor="bg-orange-500/10" borderColor="border-orange-500/20" />}
                        </div>
                    </div>
                )}

                {/* REMAINDER LIST */}
                <div className="space-y-2">
                    <div className="grid grid-cols-12 px-6 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
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
                                className="grid grid-cols-12 items-center px-6 py-4 bg-zinc-950 border border-zinc-900 rounded-xl hover:border-zinc-700 transition-colors group"
                            >
                                <div className="col-span-1 font-mono text-zinc-500 group-hover:text-white transition-colors">
                                    #{index + 4}
                                </div>
                                <div className="col-span-8 md:col-span-9 flex flex-col">
                                    <span className="font-bold text-zinc-200 uppercase tracking-tight">
                                        {entry.email.split('@')[0]}
                                    </span>
                                    <span className="text-[10px] font-mono text-zinc-600 truncate max-w-37.5 md:max-w-none">
                                        UID: {entry.userId.slice(-12)}
                                    </span>
                                </div>
                                <div className="col-span-3 md:col-span-2 text-right font-mono font-black text-zinc-300 group-hover:text-emerald-400 transition-colors">
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
                borderColor, "bg-black/40"
            )}>
                {rank === 1 ? <Crown className={color} size={32} /> : <Trophy className={color} size={24} />}
            </div>

            <div className="flex flex-col mb-4">
                <span className={cn("font-black tracking-tighter  uppercase truncate max-w-35", isLarge ? "text-2xl" : "text-lg")}>
                    {entry.email.split('@')[0]}
                </span>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Rank {rank}</span>
            </div>

            <div className="flex flex-col items-center">
                <div className={cn("font-black font-mono tracking-tight", isLarge ? "text-4xl" : "text-2xl", color)}>
                    {entry.score.toLocaleString()}
                </div>
                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1">Points</div>
            </div>

            {isLarge && (
                <div className="absolute -bottom-3 bg-yellow-500 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                    Arena_Master
                </div>
            )}
        </motion.div>
    );
}