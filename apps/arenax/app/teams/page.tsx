"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
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
    Loader2,
    Check,
    Crown,
} from "lucide-react";

interface TeamMember {
    user: {
        id: string;
        displayName: string | null;
        email: string;
        avatarColor: string;
    };
}

interface Team {
    id: string;
    name: string;
    inviteCode: string;
    ownerId: string;
    owner: {
        id: string;
        displayName: string | null;
        email: string;
        avatarColor: string;
    };
    members: TeamMember[];
    _count: { members: number };
}

export default function TeamsPage() {
    const { user, authReady } = useAuth();
    const router = useRouter();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [joining, setJoining] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [createError, setCreateError] = useState<string | null>(null);
    const [joinError, setJoinError] = useState<string | null>(null);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Auth guard
    useEffect(() => {
        if (authReady && !user) {
            router.push("/signin");
        }
    }, [authReady, user, router]);

    const getToken = () => localStorage.getItem("token");

    const fetchTeams = async () => {
        try {
            const token = getToken();
            setLoading(true);
            const response = await axios.get(`${BACKEND_URL}/team/my`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true,
            });
            if (response.data.ok) {
                setTeams(response.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch teams:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authReady && user) {
            fetchTeams();
        }
    }, [authReady, user]);

    const handleCreateTeam = async () => {
        if (!newTeamName.trim()) return;
        try {
            setCreating(true);
            setCreateError(null);
            const token = getToken();
            const response = await axios.post(
                `${BACKEND_URL}/team`,
                { name: newTeamName },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                }
            );

            if (response.data.ok) {
                setNewTeamName("");
                setShowCreateModal(false);
                fetchTeams();
            }
        } catch (err: any) {
            setCreateError(err.response?.data?.message || "Failed to create squad");
        } finally {
            setCreating(false);
        }
    };

    const handleJoinTeam = async () => {
        if (!inviteCode.trim()) return;
        try {
            setJoining(true);
            setJoinError(null);
            const token = getToken();
            const response = await axios.post(
                `${BACKEND_URL}/team/join`,
                { inviteCode },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                }
            );

            if (response.data.ok) {
                setInviteCode("");
                setShowJoinModal(false);
                fetchTeams();
            }
        } catch (err: any) {
            setJoinError(err.response?.data?.message || "Failed to join squad");
        } finally {
            setJoining(false);
        }
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    if (!authReady || (!user && authReady)) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <Loader2 className="animate-spin text-[var(--accent)]" size={32} />
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent)] selection:text-[var(--accent-text-on)]"
            style={{ fontFamily: "var(--font-syne)" }}
        >
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
                        <h1 className="text-4xl font-extrabold mb-3 tracking-tight" style={{ fontFamily: "var(--font-bebas)" }}>Your Squads</h1>
                        <p className="text-[var(--text-muted)] text-[0.9rem] max-w-md">Collaborate, compete, and climb the leaderboards together.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => { setJoinError(null); setShowJoinModal(true); }}
                            className="px-6 py-3 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-card)] transition-all flex items-center gap-2 text-sm font-bold"
                        >
                            <UserPlus size={18} className="text-[var(--text-muted)]" /> Join Squad
                        </button>
                        <button
                            onClick={() => { setCreateError(null); setShowCreateModal(true); }}
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
                        <p className="text-[var(--text-muted)] text-sm mb-8">You haven&apos;t joined or created any squads yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teams.map((team) => {
                            const isOwner = team.ownerId === user?.id;
                            return (
                                <div key={team.id} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 group hover:border-[var(--accent-border)] transition-all relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-[var(--accent-bg)] border border-[var(--accent-border)] flex items-center justify-center text-[var(--accent)]">
                                            <Users size={24} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isOwner && (
                                                <div className="font-mono text-[0.6rem] bg-[var(--accent-bg)] text-[var(--accent)] px-2 py-1 rounded border border-[var(--accent-border)] flex items-center gap-1">
                                                    <Crown size={10} /> OWNER
                                                </div>
                                            )}
                                            <div className="font-mono text-[0.6rem] bg-[var(--bg-secondary)] px-2 py-1 rounded text-[var(--text-muted)]">
                                                {team._count.members} MEMBERS
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold mb-2 group-hover:text-[var(--accent)] transition-colors">{team.name}</h3>
                                    <div
                                        className="flex items-center gap-2 mb-6 cursor-pointer group/code"
                                        onClick={() => copyToClipboard(team.inviteCode)}
                                    >
                                        <span className="font-mono text-[0.7rem] text-[var(--text-muted)] tracking-widest uppercase">
                                            CODE: <span className="text-[var(--text-primary)]">{team.inviteCode}</span>
                                        </span>
                                        {copiedCode === team.inviteCode ? (
                                            <Check size={12} className="text-green-400" />
                                        ) : (
                                            <Copy size={12} className="text-[var(--text-muted)] opacity-50 group-hover/code:text-[var(--accent)] transition-colors" />
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-[var(--border-secondary)]">
                                        <Link
                                            href={`/teams/${team.id}`}
                                            className="text-[0.7rem] font-bold uppercase tracking-widest flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                        >
                                            Dashboard <ExternalLink size={12} />
                                        </Link>
                                        <div className="flex -space-x-2">
                                            {team.members.slice(0, 4).map((m, i) => (
                                                <div
                                                    key={m.user.id}
                                                    className="w-7 h-7 rounded-full border-2 border-[var(--bg-card)] flex items-center justify-center text-[0.5rem] font-bold text-black ring-1 ring-white/10"
                                                    style={{ backgroundColor: m.user.avatarColor, zIndex: 10 - i }}
                                                    title={m.user.displayName || m.user.email}
                                                >
                                                    {(m.user.displayName || m.user.email).charAt(0).toUpperCase()}
                                                </div>
                                            ))}
                                            {team._count.members > 4 && (
                                                <div className="w-7 h-7 rounded-full border-2 border-[var(--bg-card)] bg-[var(--bg-secondary)] flex items-center justify-center text-[0.5rem] font-mono text-[var(--text-muted)]">
                                                    +{team._count.members - 4}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Feature Teaser */}
                <div className="mt-16 bg-gradient-to-r from-blue-500/[0.05] to-purple-500/[0.05] border border-[var(--border-primary)] rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center text-blue-400 shrink-0">
                        <Shield size={32} />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold mb-1">Squad Tournaments coming soon</h4>
                        <p className="text-[var(--text-muted)] text-sm italic">&quot;Unity is strength. Teamwork makes the dream work.&quot;</p>
                    </div>
                </div>
            </div>

            {/* Create Squad Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-8 max-w-md w-full shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                        <h3 className="text-2xl font-bold mb-2">Forge a new Squad</h3>
                        <p className="text-[var(--text-muted)] text-sm mb-2">Define your team identity and prepare for battle.</p>
                        <p className="text-[var(--text-muted)] text-[0.65rem] font-mono mb-6">2–30 characters</p>
                        <input
                            autoFocus
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()}
                            placeholder="e.g. Code Renegades"
                            maxLength={30}
                            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-secondary)] px-4 py-3 rounded-xl mb-6 outline-none focus:border-[var(--accent-border)] transition-colors"
                        />
                        {createError && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg mb-4 flex items-center gap-2">
                                <Info size={14} /> {createError}
                            </div>
                        )}
                        <div className="flex gap-4">
                            <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3 rounded-xl border border-[var(--border-secondary)] text-[var(--text-muted)] font-bold">Cancel</button>
                            <button
                                onClick={handleCreateTeam}
                                disabled={creating || newTeamName.trim().length < 2}
                                className="flex-1 py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-text-on)] font-bold shadow-[0_4px_15px_rgba(200,241,53,0.3)] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {creating ? <Loader2 className="animate-spin" size={18} /> : "Deploy"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Join Squad Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-8 max-w-md w-full">
                        <h3 className="text-2xl font-bold mb-2">Interlock Squad</h3>
                        <p className="text-[var(--text-muted)] text-sm mb-8">Enter the 6-character invite code to join your allies.</p>
                        <input
                            autoFocus
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === "Enter" && handleJoinTeam()}
                            placeholder="e.g. ALPH77"
                            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-secondary)] px-4 py-3 rounded-xl mb-6 outline-none focus:border-[var(--accent-border)] transition-colors text-center font-mono tracking-widest text-lg"
                            maxLength={6}
                        />
                        {joinError && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg mb-4 flex items-center gap-2 text-left">
                                <Info size={14} /> {joinError}
                            </div>
                        )}
                        <div className="flex gap-4">
                            <button onClick={() => setShowJoinModal(false)} className="flex-1 py-3 rounded-xl border border-[var(--border-secondary)] text-[var(--text-muted)] font-bold">Abort</button>
                            <button
                                onClick={handleJoinTeam}
                                disabled={joining || inviteCode.trim().length < 1}
                                className="flex-1 py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-text-on)] font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {joining ? <Loader2 className="animate-spin" size={18} /> : "Verify & Join"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
