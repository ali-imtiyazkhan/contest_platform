"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";

import { useParams } from "next/navigation";
import { use } from "react";

const Page = () => {
    const router = useRouter();

    const params = useParams()

    const contestId = params.contestId;

    console.log("contestId is ", contestId)

    return (

        <div>
            <div><SiteHeader /></div>
            <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
                <CheckCircle2 className="h-14 w-14 text-green-500" />

                <h1 className="text-xl font-semibold">
                    Submission Recorded 🎉
                </h1>

                <p className="max-w-md text-sm text-muted-foreground">
                    Your solution has been successfully submitted and recorded.
                    Results will be evaluated shortly.
                </p>

                <div className="flex gap-3 pt-2">
                    <Button className="cursor-pointer" onClick={() => router.back()}>
                        Back to Challenge
                    </Button>

                    <Button
                        className="cursor-pointer"
                        variant="secondary"
                        onClick={() => router.push("/dashboard")}
                    >
                        Go to Dashboard
                    </Button>

                    <Button onClick={() => router.push(`/contest/${contestId}/leaderboard`)}> Go to LeaderBoard</Button>
                </div>
            </div>
        </div>
    );
};

export default Page;
