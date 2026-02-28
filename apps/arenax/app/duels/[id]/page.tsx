"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthProvider";
import { BACKEND_URL } from "@/config";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import {
    Sword,
    Shield,
    Timer,
    Zap,
    Trophy,
    AlertCircle,
    Loader2,
    Code,
    CheckCircle2
} from "lucide-react";

export default function DuelArena() {
    const { id: duelId } = useParams();
    const router = useRouter();
    const { user, authReady } = useAuth();
    const [duel, setDuel] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submission, setSubmission] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [points, setPoints] = useState({ p1: 0, p2: 0 });

    const fetchDuel = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${BACKEND_URL}/api/v1/duel/${duelId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDuel(res.data.data);
            setError(null);

            // Initialize timer if active
            if (res.data.data.status === "Active" && res.data.data.startTime) {
                const start = new Date(res.data.data.startTime).getTime();
                const end = start + (res.data.data.challenge.duration * 60 * 1000);
                const remaining = Math.max(0, Math.floor((end - Date.now()) / 1000));
                setTimeLeft(remaining);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to fetch duel details. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authReady) return;
        fetchDuel();
        const interval = setInterval(fetchDuel, 5000); // Poll status
        return () => clearInterval(interval);
    }, [duelId, authReady]);

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft]);

    const handleSubmit = async () => {
        if (!submission.trim()) return;
        setSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            await axios.post(`${BACKEND_URL}/api/v1/duel/${duelId}/submit`, {
                submission
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Verification initiated!");
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-[var(--accent)]" size={48} />
            <span className="text-[0.7rem] font-bold text-[var(--text-muted)] uppercase tracking-widest animate-pulse">Entering Arena...</span>
        </div>
    );

    if (error || !duel) return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle size={64} className="text-red-500 mb-6 opacity-50" />
            <h1 className="text-4xl font-black mb-4">Arena Error</h1>
            <p className="text-[var(--text-muted)] max-w-md mb-8">
                {error || "The duel you are looking for does not exist or has been terminated."}
            </p>
            <div className="flex gap-4">
                <button
                    onClick={() => { setLoading(true); fetchDuel(); }}
                    className="px-8 py-3 rounded-xl bg-[var(--bg-secondary)] font-bold text-sm hover:bg-[var(--bg-card)] transition-all"
                >
                    Retry Connection
                </button>
                <button
                    onClick={() => router.push("/duels")}
                    className="px-8 py-3 rounded-xl bg-[var(--accent)] text-[var(--bg-primary)] font-black text-sm transition-all"
                >
                    Back to Lobby
                </button>
            </div>
        </div>
    );

    const isPlayer1 = duel.player1Id === user?.id;
    const opponent = isPlayer1 ? duel.player2 : duel.player1;

    // Handle non-active states
    if (duel.status !== "Active" && duel.status !== "Completed") {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-8 text-center">
                <Loader2 className="animate-spin text-[var(--accent)] mb-6" size={48} />
                <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">Waiting for battle...</h1>
                <p className="text-[var(--text-muted)] mb-8">This duel is currently {duel.status.toLowerCase()}. Hang tight or check the lobby.</p>
                <button onClick={() => router.push("/duels")} className="px-8 py-3 rounded-xl bg-[var(--bg-secondary)] font-bold text-sm">Return to Lobby</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
            {/* Header Arena Status */}
            <header className="h-20 bg-[var(--bg-card)] border-b border-[var(--border-primary)] px-8 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg" style={{ backgroundColor: duel.player1.avatarColor }}>
                            {duel.player1.displayName?.charAt(0)}
                        </div>
                        <div>
                            <div className="text-[0.6rem] font-bold text-[var(--text-muted)] uppercase tracking-tighter">Player 1</div>
                            <div className="text-sm font-bold">{duel.player1.displayName}</div>
                        </div>
                    </div>
                    <div className="text-[var(--text-muted)] font-black text-xl italic opacity-20">VS</div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg" style={{ backgroundColor: duel.player2.avatarColor }}>
                            {duel.player2.displayName?.charAt(0)}
                        </div>
                        <div>
                            <div className="text-[0.6rem] font-bold text-[var(--text-muted)] uppercase tracking-tighter">Player 2</div>
                            <div className="text-sm font-bold">{duel.player2.displayName}</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 text-[var(--accent)] font-mono text-2xl font-black">
                            <Timer size={24} />
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </div>
                        <div className="text-[0.5rem] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Time Remaining</div>
                    </div>

                    <div className="h-10 w-px bg-[var(--border-primary)]" />

                    <div className="flex gap-4">
                        <div className="text-right">
                            <div className="text-[0.6rem] font-bold text-[var(--text-muted)] uppercase">Status</div>
                            <div className="text-sm font-bold text-[var(--accent)] flex items-center gap-1">
                                <Zap size={14} /> {duel.status}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Challenge Section */}
                <section className="w-1/3 border-r border-[var(--border-primary)] p-8 overflow-y-auto bg-[var(--bg-secondary)]/30">
                    <div className="flex items-center gap-2 text-[var(--accent)] font-mono text-[0.7rem] uppercase tracking-widest mb-4">
                        <Code size={14} /> {duel.challenge.category}
                    </div>
                    <h2 className="text-3xl font-black mb-6 tracking-tight">{duel.challenge.title}</h2>
                    <div className="prose prose-invert max-w-none text-sm leading-relaxed text-[var(--text-muted)]" dangerouslySetInnerHTML={{ __html: duel.challenge.question }} />
                </section>

                {/* Editor/Input Section */}
                <section className="flex-1 flex flex-col p-8 gap-6">
                    <div className="flex-1 relative group">
                        <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent)]/5 to-transparent rounded-2xl pointer-events-none transition-opacity group-focus-within:opacity-100" />
                        <textarea
                            value={submission}
                            onChange={(e) => setSubmission(e.target.value)}
                            placeholder="// Implement your solution here..."
                            className="w-full h-full bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-8 font-mono text-sm outline-none focus:border-[var(--accent-border)] transition-all resize-none shadow-2xl relative z-10"
                        />
                    </div>

                    <div className="flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border-primary)] p-4 rounded-xl">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[0.65rem] font-bold text-[var(--text-muted)] uppercase">Your Progress</span>
                                <div className="w-48 h-2 bg-[var(--bg-secondary)] rounded-full mt-1 overflow-hidden">
                                    <div className="h-full bg-[var(--accent)] transition-all duration-1000" style={{ width: `${points.p1}%` }} />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[0.65rem] font-bold text-[var(--text-muted)] uppercase">Opponent</span>
                                <div className="w-48 h-2 bg-[var(--bg-secondary)] rounded-full mt-1 overflow-hidden">
                                    <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${points.p2}%` }} />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting || duel.status !== "Active"}
                            className="px-10 py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-text-on)] font-black uppercase tracking-widest text-xs hover:opacity-90 disabled:opacity-50 transition-all shadow-[0_4px_20px_rgba(200,241,53,0.3)] flex items-center gap-2"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                            Finalize Solution
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
}
