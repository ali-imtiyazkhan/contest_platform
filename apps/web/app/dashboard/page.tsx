"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Calendar,
  Clock,
  ArrowRight,
  LayoutGrid,
  Lock,
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
import { useAuth } from "@/context/AuthProvider";
import { cn } from "@/lib/utils";

type Contest = {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
};

type ContestCardProps = {
  contest: Contest;
  index: number;
  onRegister: (id: string) => void;
};

export default function DashboardPage() {
  const [challengesData, setChallengesData] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<
    "active" | "finished" | "all" | "upcoming"
  >("all");

  const { accessToken } = useAuth();
  const router = useRouter();

  const handleRegister = async (contestId: string) => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/v1/contest/${contestId}/register`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        }
      );

      alert("Registered successfully! Get ready.");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Registration failed");
    }
  };

  const fetchChallenges = async (type = view) => {
    try {
      setLoading(true);
      setError(null);

      let endpoint = "/api/v1/contest";

      if (type === "active") endpoint = "/api/v1/contest/active";
      else if (type === "finished") endpoint = "/api/v1/contest/finished";
      else if (type === "upcoming") endpoint = "/api/v1/contest/upcoming";

      const response = await axios.get(`${BACKEND_URL}${endpoint}`, {
        withCredentials: true,
      });

      setChallengesData(response.data.data || []);
    } catch (err) {
      setError("The gates are locked. Check your connection.");
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

      <main className="max-w-full mx-auto px-6 lg:px-8 py-12">
        {/* HEADER */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
          <div className="space-y-4">
            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              System Online
            </Badge>

            <h1 className="text-5xl md:text-6xl font-black tracking-tighter bg-linear-to-b from-white via-white to-zinc-600 bg-clip-text text-transparent">
              Contest Arena
            </h1>

            <p className="text-zinc-400 text-lg max-w-xl leading-relaxed">
              Step into the proving grounds. Choose your challenge and claim your spot on the leaderboard.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={view}
              onChange={(e) =>
                setView(
                  e.target.value as
                  | "active"
                  | "finished"
                  | "all"
                  | "upcoming"
                )
              }
              className="h-12 px-4 bg-zinc-900 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="finished">Finished</option>
              <option value="upcoming">Upcoming</option>
            </select>

            <Button
              variant="outline"
              onClick={() => fetchChallenges(view)}
              disabled={loading}
              className="h-12 px-6 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 rounded-xl"
            >
              <RefreshCw
                className={cn("mr-2 h-5 w-5", loading && "animate-spin")}
              />
              {loading ? "Syncing..." : "Refresh"}
            </Button>
          </div>
        </section>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-90 rounded-3xl bg-zinc-900/50 animate-pulse border border-zinc-800"
                />
              ))
            ) : error ? (
              <div className="col-span-full py-20 text-center border border-red-500/20 bg-red-500/5 rounded-3xl">
                <p className="text-red-400 font-medium">{error}</p>
                <Button
                  onClick={() => fetchChallenges(view)}
                  variant="outline"
                  className="mt-4 border-zinc-800"
                >
                  Retry
                </Button>
              </div>
            ) : challengesData.length === 0 ? (
              <div className="col-span-full py-32 text-center border border-dashed border-zinc-800 rounded-3xl">
                <LayoutGrid className="mx-auto h-12 w-12 text-zinc-700 mb-4" />
                <h3 className="text-xl font-bold text-zinc-400">
                  The Arena is empty
                </h3>
                <p className="text-zinc-600">
                  No contests found for this sector.
                </p>
              </div>
            ) : (
              challengesData.map((contest, index) => (
                <ContestCard
                  key={contest.id}
                  contest={contest}
                  index={index}
                  onRegister={handleRegister}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

/* ================= CONTEST CARD ================= */

function ContestCard({ contest, index, onRegister }: ContestCardProps) {
  const router = useRouter();

  const now = new Date();
  const start = new Date(contest.startTime);
  const end = contest.endTime ? new Date(contest.endTime) : null;

  const isLive = start <= now && (!end || end >= now);
  const isUpcoming = start > now;

  const duration =
    end && start
      ? `${Math.floor(
        (end.getTime() - start.getTime()) / (1000 * 60)
      )} mins`
      : "Open";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="group relative h-full flex flex-col overflow-hidden bg-zinc-950 border-zinc-900 transition-all duration-500 hover:border-zinc-700">
        {/* LIVE DOT */}
        {isLive && (
          <div className="absolute top-4 right-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
        )}

        <CardHeader className="p-8 space-y-4">
          <div className="flex items-center justify-between">
            <Badge
              className={cn(
                "px-3 py-1 font-bold tracking-wider",
                isLive
                  ? "bg-emerald-500 text-white"
                  : isUpcoming
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-500"
              )}
            >
              {isLive ? "LIVE" : isUpcoming ? "UPCOMING" : "ARCHIVED"}
            </Badge>

            <div className="flex items-center text-xs font-bold text-zinc-500 uppercase tracking-widest">
              <Clock className="mr-1.5 h-3.5 w-3.5" />
              {duration}
            </div>
          </div>

          <div>
            <CardTitle className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors">
              {contest.title}
            </CardTitle>
            <CardDescription className="text-zinc-400 line-clamp-3 leading-relaxed mt-2">
              {contest.description ||
                "Mission briefing classified. Enter to discover objectives."}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 w-fit">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-xs font-mono">
              {start.toLocaleDateString()}
            </span>
          </div>
        </CardContent>

        <CardFooter className="p-8 mt-auto flex flex-col gap-3">
          {isUpcoming && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onRegister(contest.id);
              }}
              className="w-full h-11 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl"
            >
              <Lock className="mr-2 h-4 w-4" />
              Register Now
            </Button>
          )}

          <Button
            onClick={() => router.push(`/contest/${contest.id}`)}
            className={cn(
              "w-full h-11 rounded-xl font-bold transition-all",
              isLive
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                : "bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300"
            )}
          >
            {isLive ? "Enter Arena" : "View Intel"}
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
