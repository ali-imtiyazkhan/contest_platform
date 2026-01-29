"use client";

import { useEffect, useState } from "react";
import { ContestCard } from "@/components/contest-card";
import axios from "axios";
import { BACKEND_URL } from "@/config";
import { useRouter } from "next/navigation";

type Contest = {
  id: string;
  title: string;
  description?: string;
  live: boolean;
  startTime?: string;
};

export default function DashboardPage() {
  const [challengesData, setChallengesData] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleStartChallenge = (id: string) => {
    router.push(`/contest/${id}`);
  };

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${BACKEND_URL}/api/v1/contest`,
        { withCredentials: true }
      );

      setChallengesData(response.data.data);
    } catch (err) {
      console.error("Failed to fetch challenges:", err);
      setError("Failed to load challenges");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  return (
    <div className="grid gap-6">
      {/* Header */}
      <header className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-pretty text-2xl font-semibold">
            Challenges
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse live and upcoming challenges. Start any challenge to begin.
            {loading && " Loading..."}
            {error && " Error loading data."}
          </p>
        </div>

        <button
          onClick={fetchChallenges}
          disabled={loading}
          className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {/* Contest Grid */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {challengesData.length === 0 && !loading && (
          <p className="text-muted-foreground">No contests found.</p>
        )}

        {challengesData.map((c) => (
          <div key={c.id} className="space-y-2">
            <ContestCard
              title={c.title}
              description={c.description ?? "No description"}
              live={c.live}
              difficulty="Easy"
              startsAt={c.startTime}
              id = {c.id}
            />

            <button
              onClick={() => handleStartChallenge(c.id)}
              className="w-full bg-red-500  rounded-md  px-3 py-2 text-sm text-primary-foreground hover:opacity-90"
            >
              Start Challenge...
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
