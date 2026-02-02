"use client";

import { useParams } from "next/navigation";
import Leaderboard from "@/components/leaderboard/LeaderBoard";

export default function Page() {
    const params = useParams<{ contestId: string }>();

    const contestId = params.contestId;

    return <Leaderboard contestId={contestId} />;
}
