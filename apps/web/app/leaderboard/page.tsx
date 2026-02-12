"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Medal, RefreshCw, Crown, TrendingUp } from "lucide-react"
import useAxios from "@/hooks/useAxios"
import { BACKEND_URL } from "@/config"
import { SiteHeader } from "@/components/site-header"
import { cn } from "@/lib/utils"

type LeaderboardRow = {
    rank: number
    name: string
    score: number
}

export default function LeaderboardPage() {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardRow[]>([])
    const { error, loading, get } = useAxios()

    const fetchLeaderboard = async () => {
        try {
            const response = await get(`${BACKEND_URL}/contest/leaderboard/demo-contest`)
            if (response?.data?.leaderboard) {
                setLeaderboardData(response.data.leaderboard)
            }
        } catch (err) {
            console.error("Failed to fetch leaderboard:", err)
        }
    }

    useEffect(() => {
        fetchLeaderboard()
    }, [])

    const topThree = leaderboardData.slice(0, 3)
    const remainingData = leaderboardData.slice(3)

    return (
        <div className="min-h-screen bg-black text-white selection:bg-orange-500/30">
            <SiteHeader />

            <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-2"
                    >
                        <div className="flex items-center gap-2 text-orange-500 font-bold tracking-widest uppercase text-xs">
                            <TrendingUp size={14} />
                            <span>Live Standings</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter bg-linear-to-b from-white to-zinc-500 bg-clip-text text-transparent">
                            Leaderboard
                        </h1>
                        <p className="text-zinc-400 max-w-md">
                            The elite performers of the 100xContest. Scores are updated in real-time.
                        </p>
                    </motion.div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={fetchLeaderboard}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-full bg-zinc-900 border border-zinc-800 px-6 py-3 text-sm font-medium transition-all hover:bg-zinc-800 disabled:opacity-50"
                    >
                        <RefreshCw className={cn("h-4 w-4 text-orange-500", loading && "animate-spin")} />
                        {loading ? "Syncing..." : "Refresh Rankings"}
                    </motion.button>
                </header>

                {/* Podium Section (Top 3) */}
                {!loading && topThree.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {topThree.map((user, index) => (
                            <PodiumCard key={user.rank} user={user} index={index} />
                        ))}
                    </div>
                )}

                {/* List Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="border-b border-zinc-900 bg-zinc-900/30">
                            <CardTitle className="text-sm font-medium text-zinc-400">All Participants</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-[10px] uppercase tracking-wider text-zinc-500 bg-black/20">
                                            <th className="px-6 py-4 font-bold">Rank</th>
                                            <th className="px-6 py-4 font-bold">Participant</th>
                                            <th className="px-6 py-4 text-right font-bold">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-900">
                                        <AnimatePresence>
                                            {remainingData.map((row, i) => (
                                                <LeaderboardRow key={row.rank} row={row} index={i} />
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>

                                {!loading && leaderboardData.length === 0 && (
                                    <div className="py-20 text-center space-y-3">
                                        <p className="text-zinc-500 text-sm">No data available yet.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </main>
        </div>
    )
}

function PodiumCard({ user, index }: { user: LeaderboardRow; index: number }) {
    const variants = [
        { color: "text-orange-500", border: "border-orange-500/20", bg: "from-orange-500/10", icon: <Crown /> },
        { color: "text-zinc-300", border: "border-zinc-300/20", bg: "from-zinc-300/10", icon: <Medal /> },
        { color: "text-amber-700", border: "border-amber-700/20", bg: "from-amber-700/10", icon: <Medal /> },
    ]

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
                "relative group overflow-hidden rounded-3xl border p-6 bg-linear-to-b to-transparent transition-all hover:-translate-y-1",
                variants[index].border,
                variants[index].bg
            )}
        >
            <div className={cn("absolute top-4 right-4 opacity-20 group-hover:opacity-100 transition-opacity", variants[index].color)}>
                {variants[index].icon}
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                    <Avatar className="h-20 w-20 border-2 border-zinc-800 shadow-2xl">
                        <AvatarFallback className="bg-zinc-900 text-xl font-bold">{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className={cn("absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 border text-xs font-bold", variants[index].border, variants[index].color)}>
                        #{user.rank}
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-lg text-white">{user.name}</h3>
                    <p className="text-zinc-500 text-xs uppercase tracking-widest font-semibold">Top Tier</p>
                </div>

                <div className="w-full pt-4 border-t border-white/5">
                    <p className="text-2xl font-black tabular-nums tracking-tighter text-white">
                        {user.score.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Points Gathered</p>
                </div>
            </div>
        </motion.div>
    )
}

function LeaderboardRow({ row, index }: { row: LeaderboardRow; index: number }) {
    return (
        <motion.tr
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="group hover:bg-white/2 transition-colors"
        >
            <td className="px-6 py-4">
                <span className="text-sm font-mono text-zinc-500 group-hover:text-orange-500 transition-colors">
                    {row.rank.toString().padStart(2, '0')}
                </span>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-zinc-800">
                        <AvatarFallback className="text-[10px] bg-zinc-900 text-zinc-400">
                            {row.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-zinc-200 group-hover:text-white">{row.name}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-right">
                <span className="text-sm font-bold tabular-nums text-zinc-100">
                    {row.score.toLocaleString()}
                </span>
            </td>
        </motion.tr>
    )
}