"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { BACKEND_URL } from "@/config";
import axios from "axios";
import Link from "next/link";
import {
    Swords,
    Search,
    UserPlus,
    Clock,
    Trophy,
    ChevronRight,
    Loader2,
    ShieldAlert,
    Check,
    X
} from "lucide-react";

interface DuelParticipant {
    id: string;
    displayName: string | null;
    email: string;
    avatarColor: string;
}

interface Duel {
    id: string;
    player1: DuelParticipant;
    player2: DuelParticipant;
    challenge: {
        title: string;
        category: string;
    };
    status: "Pending" | "Active" | "Completed" | "Cancelled";
    createdAt: string;
}

export default function DuelsPage() {
    const { user, authReady } = useAuth();
    const [duels, setDuels] = useState<Duel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [challenges, setChallenges] = useState<any[]>([]);

    const fetchDuels = async () => {
        // This would call a new endpoint GET /api/v1/duel/my
        // For now, we'll fetch a list or show empty
        setLoading(false);
    };

    const searchUsers = async () => {
        if (searchQuery.length < 3) return;
        setSearching(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${BACKEND_URL}/api/v1/user/search?q=${searchQuery}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSearchResults(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setSearching(false);
        }
    };

    const handleInvite = async (targetUserId: string) => {
        try {
            const token = localStorage.getItem("token");
            // Pick a default challenge for now or show a selector
            const res = await axios.post(`${BACKEND_URL}/api/v1/duel/invite`, {
                player2Id: targetUserId,
                challengeId: "default-challenge-id" // Need to handle challenge selection
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.ok) {
                alert("Invite sent!");
                fetchDuels();
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (authReady) fetchDuels();
    }, [authReady]);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <div className="max-w-6xl mx-auto px-6 py-12">
                <nav className="flex items-center gap-2 mb-12 font-mono text-[0.7rem] uppercase tracking-widest text-[var(--text-muted)]">
                    <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
                    <ChevronRight size={12} className="text-[var(--text-muted)] opacity-20" />
                    <span className="text-[var(--text-primary)]">Arena Duels</span>
                </nav>

                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div>
                        <h1 className="text-4xl font-extrabold mb-3 tracking-tight flex items-center gap-4">
                            <Swords className="text-[var(--accent)]" size={40} />
                            Battle Arena
                        </h1>
                        <p className="text-[var(--text-muted)] text-[0.9rem] max-w-md">
                            Identity verified. Weapons hot. Challenge other engineers to 1v1 duels in real-time.
                        </p>
                    </div>

                    <div className="w-full md:w-80 relative">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                                placeholder="Search opponent..."
                                className="w-full bg-[var(--bg-card)] border border-[var(--border-primary)] pl-12 pr-4 py-3 rounded-xl focus:border-[var(--accent-border)] outline-none transition-all shadow-lg shadow-black/20"
                            />
                        </div>

                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden z-50 shadow-2xl">
                                {searchResults.map((u) => (
                                    <div key={u.id} className="p-3 hover:bg-[var(--bg-secondary)] flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: u.avatarColor }}>
                                                {u.displayName?.charAt(0) || u.email.charAt(0)}
                                            </div>
                                            <div className="text-sm font-bold">{u.displayName || u.email.split("@")[0]}</div>
                                        </div>
                                        <button
                                            onClick={() => handleInvite(u.id)}
                                            className="p-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-text-on)] opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <UserPlus size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                            <Clock size={16} /> Active Engagements
                        </h3>

                        {loading ? (
                            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[var(--accent)]" /></div>
                        ) : duels.length === 0 ? (
                            <div className="bg-[var(--bg-card)] border border-dashed border-[var(--border-primary)] rounded-2xl p-12 text-center">
                                <ShieldAlert className="mx-auto mb-4 text-[var(--text-muted)]" size={32} />
                                <p className="text-[var(--text-muted)]">No active duels found. Initiate a search to find an opponent.</p>
                            </div>
                        ) : (
                            duels.map((duel) => (
                                <div key={duel.id} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-[var(--accent-border)] transition-all">
                                    <div className="flex items-center gap-8">
                                        <div className="flex -space-x-3">
                                            <div className="w-12 h-12 rounded-full border-2 border-[var(--bg-card)] bg-blue-500 flex items-center justify-center font-bold">A</div>
                                            <div className="w-12 h-12 rounded-full border-2 border-[var(--bg-card)] bg-red-500 flex items-center justify-center font-bold">B</div>
                                        </div>
                                        <div>
                                            <div className="text-[0.6rem] font-bold uppercase tracking-widest text-[var(--accent)] mb-1">{duel.challenge.category}</div>
                                            <h4 className="font-bold text-lg">{duel.challenge.title}</h4>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/duels/${duel.id}`}
                                        className="px-6 py-2 rounded-lg bg-[var(--accent)] text-[var(--accent-text-on)] font-bold text-sm tracking-wide"
                                    >
                                        ENTER ARENA
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                            Hall of Valor
                        </h3>
                        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6">
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="text-[var(--text-muted)] font-mono text-xs">0{i}</div>
                                            <div className="font-bold text-sm">EliteCoder_x</div>
                                        </div>
                                        <div className="text-[var(--accent)] font-mono text-xs">2.4kpts</div>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-6 py-3 rounded-xl border border-[var(--border-secondary)] text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest hover:bg-[var(--bg-secondary)] transition-all">
                                View Full Leaderboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
