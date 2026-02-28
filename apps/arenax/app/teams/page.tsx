"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { BACKEND_URL } from "@/config";
import axios from "axios";
import Link from "next/link";
import {
    Users,
    Plus,
    UserPlus,
    Copy,
    Shield,
    ExternalLink,
    ChevronRight,
    Info,
    Loader2
} from "lucide-react";

interface TeamMember {
    id: string;
    displayName: string | null;
    email: string;
    avatarColor: string;
    role: "OWNER" | "MEMBER";
}

interface Team {
    id: string;
    name: string;
    inviteCode: string;
    memberCount: number;
    members?: TeamMember[];
}

export default function TeamsPage() {
    const { user, authReady } = useAuth();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [joining, setJoining] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [error, setError] = useState<string | null>(null);

    const fetchTeams = async () => {
        try {

            const token = localStorage.getItem("token");
            setLoading(true);
            const response = await axios.get(`${BACKEND_URL}/api/v1/team/my`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                withCredentials: true
            });
            if (response.data.ok) {
                const fetchedTeams = response.data.data.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    inviteCode: t.inviteCode,
                    memberCount: t._count?.members || 0
                }));
                setTeams(fetchedTeams);
            }
        } catch (err) {
            console.error("Failed to fetch teams:", err);
            setError("Failed to load squads. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authReady) {
            fetchTeams();
        }
    }, [authReady]);

    const handleCreateTeam = async () => {
        if (!newTeamName.trim()) return;
        try {
            setCreating(true);
            setError(null);
            const token = localStorage.getItem("token");
            const response = await axios.post(`${BACKEND_URL}/api/v1/team`, {
                name: newTeamName
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                withCredentials: true
            });

            if (response.data.ok) {
                setNewTeamName("");
                setShowCreateModal(false);
                fetchTeams();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to create squad");
        } finally {
            setCreating(false);
        }
    };

    const handleJoinTeam = async () => {
        if (!inviteCode.trim()) return;
        try {
            setJoining(true);
            setError(null);
            const token = localStorage.getItem("token");
            const response = await axios.post(`${BACKEND_URL}/api/v1/team/join`, {
                inviteCode
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                withCredentials: true
            });

            if (response.data.ok) {
                setInviteCode("");
                setShowJoinModal(false);
                fetchTeams();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to join squad");
        } finally {
            setJoining(false);
        }
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        // Add toast notification later
        alert("Invite code copied to clipboard!");
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent)] selection:text-[var(--accent-text-on)]">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-[var(--accent)] opacity-5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
                <nav className="flex items-center gap-2 mb-12 font-mono text-[0.7rem] uppercase tracking-widest text-[var(--text-muted)]">
                    <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
                    <ChevronRight size={12} className="text-[var(--text-muted)] opacity-20" />
                    <span className="text-[var(--text-primary)]">Squads</span>
                </nav>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-extrabold mb-3 tracking-tight">Your Squads</h1>
                        <p className="text-[var(--text-muted)] text-[0.9rem] max-w-md">Collaborate, compete, and climb the leaderboards together.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowJoinModal(true)}
                            className="px-6 py-3 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-card)] transition-all flex items-center gap-2 text-sm font-bold"
                        >
                            <UserPlus size={18} className="text-[var(--text-muted)]" /> Join Squad
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-text-on)] hover:opacity-90 transition-all flex items-center gap-2 text-sm font-bold shadow-[0_4px_20px_rgba(200,241,53,0.3)]"
                        >
                            <Plus size={18} /> Create New
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 text-center font-mono text-[var(--accent)] animate-pulse">Scanning frequencies...</div>
                ) : teams.length === 0 ? (
                    <div className="bg-[var(--bg-card)] border border-dashed border-[var(--border-primary)] rounded-2xl p-20 text-center">
                        <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users className="text-[var(--text-muted)]" size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No squads found</h3>
                        <p className="text-[var(--text-muted)] text-sm mb-8">You haven't joined or created any squads yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teams.map((team) => (
                            <div key={team.id} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 group hover:border-[var(--accent-border)] transition-all relative overflow-hidden">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-[var(--accent-bg)] border border-[var(--accent-border)] flex items-center justify-center text-[var(--accent)]">
                                        <Users size={24} />
                                    </div>
                                    <div className="font-mono text-[0.6rem] bg-[var(--bg-secondary)] px-2 py-1 rounded text-[var(--text-muted)]">
                                        {team.memberCount} MEMBERS
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold mb-2 group-hover:text-[var(--accent)] transition-colors">{team.name}</h3>
                                <div className="flex items-center gap-2 mb-6 cursor-pointer group/code" onClick={() => copyToClipboard(team.inviteCode)}>
                                    <span className="font-mono text-[0.7rem] text-[var(--text-muted)] tracking-widest uppercase">CODE: <span className="text-[var(--text-primary)]">{team.inviteCode}</span></span>
                                    <Copy size={12} className="text-[var(--text-muted)] opacity-50 group-hover/code:text-[var(--accent)] transition-colors" />
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-[var(--border-secondary)]">
                                    <Link href={`/teams/${team.id}`} className="text-[0.7rem] font-bold uppercase tracking-widest flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                                        Dashboard <ExternalLink size={12} />
                                    </Link>
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-6 h-6 rounded-full border border-[var(--bg-card)] bg-[var(--accent)] text-[0.5rem] flex items-center justify-center font-bold text-[var(--accent-text-on)] ring-1 ring-white/10">
                                                {String.fromCharCode(64 + i)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Feature Teaser */}
                <div className="mt-16 bg-gradient-to-r from-blue-500/[0.05] to-purple-500/[0.05] border border-[var(--border-primary)] rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center text-blue-400 shrink-0">
                        <Shield size={32} />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold mb-1">Squad Tournaments coming soon</h4>
                        <p className="text-[var(--text-muted)] text-sm italic">"Unity is strength. Teamwork makes the dream work."</p>
                    </div>
                </div>
            </div>

            {/* Modal Placeholders (Functional logic would go here) */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-8 max-w-md w-full shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                        <h3 className="text-2xl font-bold mb-2">Force a new Squad</h3>
                        <p className="text-[var(--text-muted)] text-sm mb-8">Define your team identity and prepare for battle.</p>
                        <input
                            autoFocus
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            placeholder="e.g. Code Renegades"
                            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-secondary)] px-4 py-3 rounded-xl mb-6 outline-none focus:border-[var(--accent-border)] transition-colors"
                        />
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg mb-4 flex items-center gap-2">
                                <Info size={14} /> {error}
                            </div>
                        )}
                        <div className="flex gap-4">
                            <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3 rounded-xl border border-[var(--border-secondary)] text-[var(--text-muted)] font-bold">Cancel</button>
                            <button
                                onClick={handleCreateTeam}
                                disabled={creating}
                                className="flex-1 py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-text-on)] font-bold shadow-[0_4px_15px_rgba(200,241,53,0.3)] flex items-center justify-center gap-2"
                            >
                                {creating ? <Loader2 className="animate-spin" size={18} /> : "Deploy"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showJoinModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-8 max-w-md w-full">
                        <h3 className="text-2xl font-bold mb-2">Interlock Squad</h3>
                        <p className="text-[var(--text-muted)] text-sm mb-8">Enter the 6-character invite code to join your allies.</p>
                        <input
                            autoFocus
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            placeholder="e.g. ALPH77"
                            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-secondary)] px-4 py-3 rounded-xl mb-6 outline-none focus:border-[var(--accent-border)] transition-colors text-center font-mono tracking-widest text-lg"
                            maxLength={6}
                        />
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg mb-4 flex items-center gap-2 text-left">
                                <Info size={14} /> {error}
                            </div>
                        )}
                        <div className="flex gap-4">
                            <button onClick={() => setShowJoinModal(false)} className="flex-1 py-3 rounded-xl border border-[var(--border-secondary)] text-[var(--text-muted)] font-bold">Abort</button>
                            <button
                                onClick={handleJoinTeam}
                                disabled={joining}
                                className="flex-1 py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-text-on)] font-bold flex items-center justify-center gap-2"
                            >
                                {joining ? <Loader2 className="animate-spin" size={18} /> : "Verify & Join"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Bebas+Neue&display=swap');
        body { font-family: 'Syne', sans-serif; }
      `}</style>
        </div>
    );
}
