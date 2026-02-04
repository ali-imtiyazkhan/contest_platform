"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Crown, User } from "lucide-react";

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
            // Sort by score descending just in case the API doesn't
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

        // IMPORTANT: Cleanup to prevent memory leaks
        return () => clearInterval(interval);
    }, [contestId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-full mx-auto items-center p-4 md:p-8 gap-10">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
                        <Trophy className="text-yellow-500 w-10 h-10" />
                        LEADERBOARD
                    </h1>
                    <p className="text-zinc-500 mt-1">Live updates every 5 seconds</p>
                </div>
                <div className="bg-zinc-800/50 px-4 py-2 rounded-full border border-zinc-700 text-xs font-mono text-zinc-400">
                    ID: {contestId}
                </div>
            </div>

            {data.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-800">
                    <p className="text-zinc-500">No participants yet. Be the first!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {data.map((entry, index) => {
                            const isTopThree = index < 3;

                            return (
                                <motion.div
                                    layout
                                    key={entry.userId}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className={`relative group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${index === 0
                                        ? "bg-linear-to-r from-yellow-900/30 to-zinc-900 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.1)]"
                                        : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative flex items-center justify-center w-12">
                                            {index === 0 && <Crown className="absolute -top-6 text-yellow-500 w-6 h-6 animate-bounce" />}
                                            <span className={`text-2xl font-black ${index === 0 ? "text-yellow-500" :
                                                index === 1 ? "text-zinc-300" :
                                                    index === 2 ? "text-orange-400" : "text-zinc-600"
                                                }`}>
                                                {index + 1}
                                            </span>
                                        </div>

                                        <div className="flex flex-col">
                                            <span className="font-bold text-zinc-100 group-hover:text-white transition-colors">
                                                {entry.email.split('@')[0]}
                                                <span className="text-zinc-600 font-normal text-sm ml-1">
                                                    @{entry.email.split('@')[1]}
                                                </span>
                                            </span>
                                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                                                UID: {entry.userId.slice(-8)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className={`text-2xl font-black ${index === 0 ? "text-yellow-500" : "text-white"}`}>
                                                {entry.score.toLocaleString()}
                                            </div>
                                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Points</div>
                                        </div>

                                        {/* Visual Indicator for Top 3 */}
                                        {isTopThree && (
                                            <div className={`p-2 rounded-full ${index === 0 ? "bg-yellow-500/20 text-yellow-500" :
                                                index === 1 ? "bg-zinc-100/10 text-zinc-300" :
                                                    "bg-orange-500/20 text-orange-500"
                                                }`}>
                                                <Medal size={20} />
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}