"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import useAxios from "@/hooks/useAxios"
import { BACKEND_URL } from "@/config"

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
            const response = await get(
                `${BACKEND_URL}/contest/leaderboard/demo-contest`
            )

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

    return (
        <div className="grid gap-6">
            {/* Header */}
            <header className="space-y-1">
                <h1 className="text-2xl font-semibold">Leaderboard</h1>
                <p className="text-sm text-muted-foreground">
                    Top participants by cumulative score.
                    {loading && " Loading..."}
                    {error && " Error loading data."}
                </p>
            </header>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">All-time Ranking</CardTitle>

                    <button
                        onClick={fetchLeaderboard}
                        disabled={loading}
                        className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                    >
                        {loading ? "Refreshing..." : "Refresh"}
                    </button>
                </CardHeader>

                <CardContent>
                    {/* Empty State */}
                    {!loading && leaderboardData.length === 0 && (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            No leaderboard data available yet.
                        </p>
                    )}

                    {/* Table */}
                    {leaderboardData.length > 0 && (
                        <div className="max-h-96 overflow-auto rounded-md border">
                            <table className="w-full table-auto text-left">
                                <thead className="sticky top-0 bg-muted/40 backdrop-blur">
                                    <tr className="text-xs text-muted-foreground">
                                        <th className="px-3 py-2 font-medium">Rank</th>
                                        <th className="px-3 py-2 font-medium">Participant</th>
                                        <th className="px-3 py-2 text-right font-medium">Score</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {leaderboardData.map((r) => {
                                        const top = r.rank <= 3

                                        return (
                                            <tr
                                                key={r.rank}
                                                className="border-t transition hover:bg-muted/40"
                                            >
                                                {/* Rank */}
                                                <td className="px-3 py-2 text-sm">
                                                    <span
                                                        className={
                                                            top
                                                                ? "inline-flex min-w-6 items-center justify-center rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground"
                                                                : "inline-flex min-w-6 items-center justify-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                                                        }
                                                    >
                                                        {r.rank}
                                                    </span>
                                                </td>

                                                {/* Name */}
                                                <td className="px-3 py-2 text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar
                                                            className={
                                                                "h-7 w-7 " +
                                                                (top ? "ring-2 ring-primary" : "")
                                                            }
                                                        >
                                                            <AvatarFallback className="text-[10px]">
                                                                {r.name
                                                                    .split(" ")
                                                                    .map((n) => n[0])
                                                                    .join("")
                                                                    .slice(0, 2)}
                                                            </AvatarFallback>
                                                        </Avatar>

                                                        <span>{r.name}</span>
                                                    </div>
                                                </td>

                                                {/* Score */}
                                                <td className="px-3 py-2 text-right text-sm font-mono tabular-nums">
                                                    {r.score}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
