"use client";

import { CheckCircle2, Trophy, LayoutDashboard, ArrowLeft, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";

const Page = () => {
    const router = useRouter();
    const params = useParams();
    const contestId = params.contestId;

    return (
        <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
            <SiteHeader />
            
            <div className="relative flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
                {/* Background Glow Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 blur-[120px] rounded-full -z-10" />

                {/* Success Icon */}
                <div className="mb-8 relative">
                    <div className="absolute inset-0 scale-150 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
                    <CheckCircle2 className="relative h-20 w-20 text-emerald-500" />
                </div>

                {/* Text Content */}
                <div className="space-y-4 mb-10">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-linear-to-b from-white to-zinc-500 bg-clip-text text-transparent">
                        MISSION ACCOMPLISHED
                    </h1>
                    <p className="max-w-md mx-auto text-lg text-zinc-400 leading-relaxed">
                        Your final solution has been successfully encrypted and recorded in the arena archives. 
                        Evaluation is in progress.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
                    <Button 
                        variant="outline"
                        className="flex-1 h-14 rounded-xl border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all gap-2"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Revisit Task
                    </Button>

                    <Button 
                        className="flex-1 h-14 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)] gap-2"
                        onClick={() => router.push(`/contest/${contestId}/leaderboard`)}
                    >
                        <BarChart3 className="h-4 w-4" />
                        View Leaderboard
                    </Button>
                </div>

                <Button
                    variant="ghost"
                    className="mt-6 text-zinc-500 hover:text-emerald-400 transition-colors gap-2"
                    onClick={() => router.push("/dashboard")}
                >
                    <LayoutDashboard className="h-4 w-4" />
                    Return to Dashboard
                </Button>

                {/* Decorative Trophy Icon */}
                <div className="mt-16 flex items-center gap-2 text-zinc-800">
                    <Trophy className="h-5 w-5" />
                    <span className="text-xs font-mono uppercase tracking-[0.3em]">Arena Session Closed</span>
                </div>
            </div>
        </div>
    );
};

export default Page;