"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Calendar,
  Clock,
  ArrowRight,
  LayoutGrid,
} from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { BACKEND_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Contest = {
  id: string;
  title: string;
  description?: string;
  live: boolean;
  startTime?: string;
};

export default function DashboardPage() {
  const [challengesData, setChallengesData] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"active" | "finished" | "all" | "upcoming">("all");

  const router = useRouter();

  const fetchChallenges = async (type = view) => {
    try {
      setLoading(true);
      setError(null);

      let endpoint = "/api/v1/contest";

      if (type === "active") {
        endpoint = "/api/v1/contest/active";
      } else if (type === "finished") {
        endpoint = "/api/v1/contest/finished";
      }

      else if (type === "upcoming") {
        endpoint = "/api/v1/contest/upcoming"
      }


      else {
        endpoint = "/api/v1/contest";
      }

      const response = await axios.get(`${BACKEND_URL}${endpoint}`, {
        withCredentials: true,
      });

      setChallengesData(response.data.data || []);
    } catch (err) {
      setError("Unable to reach the arena. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges(view);
  }, [view]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
      <SiteHeader />

      <main className="max-w-full px-6 sm:px-8 lg:px-12 py-12 space-y-16">

        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-8 mt-4">
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-linear-to-b from-white to-zinc-500 bg-clip-text text-transparent">
                Contest Arena
              </h1>
              <p className="text-zinc-400 mt-3 text-lg max-w-2xl leading-relaxed">
                High-stakes developer challenges. Prove your logic and dominate the board.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            {/* VIEW DROPDOWN */}
            <select
              value={view}
              onChange={(e) =>
                setView(e.target.value as "active" | "finished" | "all")
              }
              className="h-12 px-4 bg-zinc-900 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Contests</option>
              <option value="active">Active</option>
              <option value="finished">Finished</option>
              <option value="upcoming">Upcoming</option>
            </select>

            {/* REFRESH BUTTON */}
            <Button
              variant="outline"
              onClick={() => fetchChallenges(view)}
              disabled={loading}
              className="h-12 px-6 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all rounded-xl"
            >
              <RefreshCw
                className={`mr-2 h-5 w-5 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Syncing..." : "Refresh Arena"}
            </Button>
          </div>
        </section>

        <div className="h-px w-full bg-zinc-900" />

        {/* GRID */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 pb-20 pt-10">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-zinc-950 border-zinc-900 h-80" />
            ))
          ) : error ? (
            <div className="col-span-full py-20 text-center bg-red-500/5 rounded-3xl border border-red-500/10">
              <p className="text-red-400 text-lg">{error}</p>
              <Button
                variant="outline"
                onClick={() => fetchChallenges(view)}
                className="mt-6 border-zinc-800"
              >
                Try Again
              </Button>
            </div>
          ) : challengesData.length === 0 ? (
            <div className="col-span-full py-32 text-center border border-zinc-900 bg-zinc-950/50 rounded-4xl">
              <LayoutGrid className="mx-auto h-16 w-16 text-zinc-800 mb-6" />
              <h3 className="text-2xl font-bold text-zinc-300">
                No contests available
              </h3>
              <p className="text-zinc-500 mt-2">
                The arena is quiet... check back later.
              </p>
            </div>
          ) : (
            challengesData.map((contest) => (
              <Card
                key={contest.id}
                className="group relative flex flex-col bg-zinc-950 border-zinc-900 rounded-2xl transition-all duration-300 hover:border-emerald-500/40 hover:-translate-y-1"
              >
                <CardHeader className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <Badge
                      className={
                        contest.live
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1"
                          : "bg-zinc-900 text-zinc-500 border-zinc-800 px-3 py-1"
                      }
                    >
                      {contest.live ? "● LIVE" : "FINISHED"}
                    </Badge>
                    <div className="flex items-center text-xs font-mono text-zinc-500 tracking-wider">
                      <Clock className="mr-1.5 h-3.5 w-3.5" />
                      60 MINS
                    </div>
                  </div>

                  <CardTitle className="text-2xl font-bold text-zinc-100 group-hover:text-white transition-colors mb-2">
                    {contest.title}
                  </CardTitle>

                  <CardDescription className="text-zinc-400 line-clamp-2 text-base leading-relaxed">
                    {contest.description ||
                      "Mission briefing unavailable for this sector."}
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-6 py-4 mt-auto">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-mono">
                        {contest.startTime
                          ? new Date(contest.startTime).toLocaleDateString()
                          : "TBD"}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-6">
                  <Button
                    onClick={() => router.push(`/contest/${contest.id}`)}
                    className={`w-full h-12 rounded-xl text-base font-bold transition-all ${contest.live
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
                      }`}
                  >
                    {contest.live ? "Enter Arena" : "View Details"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
