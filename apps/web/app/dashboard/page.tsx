"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { RefreshCw, Trophy, Calendar, Clock, ArrowRight, LayoutGrid } from "lucide-react";

import { BACKEND_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Contest = {
  id: string;
  title: string;
  description?: string;
  live: boolean;
  startTime?: string;
};

export default function DashboardPage() {
  const [challengesData, setChallengesData] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true); // Start as true for initial mount
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${BACKEND_URL}/api/v1/contest`, {
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
    fetchChallenges();
  }, []);

  return (
    <div className="max-w-full mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Active Arena
          </h1>
          <p className="text-muted-foreground mt-1">
            Compete in real-time developer challenges and climb the leaderboard.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={fetchChallenges}
          disabled={loading}
          className="w-fit"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Syncing..." : "Refresh Arena"}
        </Button>
      </div>

      <hr className="border-slate-200" />

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          // Loading State: Skeleton Cards
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="gap-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))
        ) : error ? (
          // Error State
          <div className="col-span-full py-12 text-center bg-destructive/5 rounded-xl border border-destructive/20">
            <p className="text-destructive font-medium">{error}</p>
            <Button variant="ghost" onClick={fetchChallenges} className="mt-4">Try Again</Button>
          </div>
        ) : challengesData.length === 0 ? (
          // Empty State
          <div className="col-span-full py-20 text-center border-2 border-dashed rounded-2xl">
            <LayoutGrid className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No challenges live</h3>
            <p className="text-muted-foreground">Check back later for new contests.</p>
          </div>
        ) : (
          // Contest Cards
          challengesData.map((contest) => (
            <Card key={contest.id} className="group flex flex-col transition-all hover:shadow-lg hover:border-primary/50">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={contest.live ? "default" : "secondary"} className={contest.live ? "bg-emerald-500 hover:bg-emerald-600 animate-pulse" : ""}>
                    {contest.live ? "● LIVE" : "UPCOMING"}
                  </Badge>
                  <span className="text-xs font-medium text-muted-foreground flex items-center">
                    <Clock className="mr-1 h-3 w-3" />
                    60m
                  </span>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {contest.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {contest.description || "No description provided for this challenge."}
                </CardDescription>
              </CardHeader>

              <CardContent className="glow">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {contest.startTime ? new Date(contest.startTime).toLocaleDateString() : "TBD"}
                  </div>
                  <Badge variant="outline" className="font-normal">Easy</Badge>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  onClick={() => router.push(`/contest/${contest.id}`)}
                  className="w-full group/btn"
                  variant={contest.live ? "default" : "outline"}
                >
                  {contest.live ? "Enter Arena" : "View Details"}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}