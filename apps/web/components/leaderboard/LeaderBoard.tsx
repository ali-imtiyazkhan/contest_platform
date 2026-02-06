"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Crown, Timer, Hash } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

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
            <div className="min-h-screen bg-black flex justify-center items-center">
                <div className="relative h-12 w-12">
                    <div className="absolute inset-0 rounded-full border-2 border-zinc-800"></div>
                    <div className="absolute inset-0 rounded-full border-t-2 border-yellow-500 animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-yellow-500/30">
            <SiteHeader />

            <main className="max-w-full mx-auto px-6 sm:px-8 lg:px-12 py-12 space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                                <Trophy className="text-yellow-500 w-8 h-8" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-4xl font-black tracking-tighter text-white">
                                    ARENA RANKINGS
                                </h1>
                                <div className="flex items-center gap-2 text-zinc-500 text-sm font-mono uppercase tracking-widest">
                                    <Timer className="w-3.5 h-3.5 text-emerald-500" />
                                    Live Updates Enabled
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-zinc-900/50 px-5 py-3 rounded-xl border border-zinc-800">
                        <Hash className="w-4 h-4 text-zinc-600" />
                        <span className="text-xs font-mono text-zinc-400">SESSION_ID: {contestId.slice(0, 8)}</span>
                    </div>
                </div>

                {/* Leaderboard List */}
                {data.length === 0 ? (
                    <div className="text-center py-32 bg-zinc-950 rounded-[2.5rem] border border-dashed border-zinc-900">
                        <Trophy className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                        <p className="text-zinc-500 font-medium">No combatants have entered the arena yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 pb-24">
                        <AnimatePresence mode="popLayout">
                            {data.map((entry, index) => {
                                const isRank1 = index === 0;
                                const isRank2 = index === 1;
                                const isRank3 = index === 2;

                                return (
                                    <motion.div
                                        layout
                                        key={entry.userId}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 40 }}
                                        className={`group relative flex items-center justify-between p-5 md:p-6 rounded-2xl border transition-all duration-300 ${isRank1
                                                ? "bg-zinc-900/40 border-yellow-500/40 shadow-[0_0_30px_-10px_rgba(234,179,8,0.2)]"
                                                : "bg-zinc-950 border-zinc-900 hover:border-zinc-700"
                                            }`}
                                    >
                                        <div className="flex items-center gap-6">
                                            {/* Rank Indicator */}
                                            <div className="relative flex items-center justify-center w-10">
                                                {isRank1 && (
                                                    <Crown className="absolute -top-7 text-yellow-500 w-5 h-5 animate-pulse" />
                                                )}
                                                <span className={`text-2xl font-black italic ${isRank1 ? "text-yellow-500" :
                                                        isRank2 ? "text-zinc-300" :
                                                            isRank3 ? "text-orange-500" : "text-zinc-700"
                                                    }`}>
                                                    #{index + 1}
                                                </span>
                                            </div>

                                            {/* User Info */}
                                            <div className="flex flex-col">
                                                <span className="text-lg font-bold text-zinc-100 group-hover:text-white transition-colors">
                                                    {entry.email.split('@')[0]}
                                                    <span className="text-zinc-600 font-normal text-sm ml-1 hidden sm:inline">
                                                        @{entry.email.split('@')[1]}
                                                    </span>
                                                </span>
                                                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
                                                    TOKEN: {entry.userId.slice(-12)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <div className={`text-2xl md:text-3xl font-black tracking-tighter ${isRank1 ? "text-yellow-500" : "text-white"}`}>
                                                    {entry.score.toLocaleString()}
                                                </div>
                                                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-right">Points</div>
                                            </div>

                                            {/* Medal Visual */}
                                            {(isRank1 || isRank2 || isRank3) && (
                                                <div className={`hidden sm:flex p-2.5 rounded-xl border ${isRank1 ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" :
                                                        isRank2 ? "bg-zinc-100/5 border-zinc-100/10 text-zinc-400" :
                                                            "bg-orange-500/10 border-orange-500/20 text-orange-500"
                                                    }`}>
                                                    <Medal size={22} />
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}