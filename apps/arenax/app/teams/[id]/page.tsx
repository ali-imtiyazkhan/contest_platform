"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/config";
import axios from "axios";
import Link from "next/link";
import {
    Users,
    Crown,
    Copy,
    Check,
    ChevronRight,
    Loader2,
    LogOut,
    Trash2,
    UserMinus,
    Shield,
    Calendar,
    Star,
} from "lucide-react";

interface Member {
    id: string;
    joinedAt: string;
    user: {
        id: string;
        displayName: string | null;
        email: string;
        avatarColor: string;
        rating: number;
    };
}

interface TeamDetail {
    id: string;
    name: string;
    inviteCode: string;
    ownerId: string;
    createdAt: string;
    owner: {
        id: string;
        displayName: string | null;
        email: string;
        avatarColor: string;
    };
    members: Member[];
    _count: { members: number };
    isMember: boolean;
}

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: teamId } = use(params);
    const { user, authReady } = useAuth();
    const router = useRouter();

    const [team, setTeam] = useState<TeamDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [copiedCode, setCopiedCode] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const getToken = () => localStorage.getItem("token");

    useEffect(() => {
        if (authReady && !user) {
            router.push("/signin");
        }
    }, [authReady, user, router]);

    const fetchTeam = async () => {
        try {
            const token = getToken();
            const res = await axios.get(`${BACKEND_URL}/team/${teamId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.ok) {
                setTeam(res.data.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load team");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authReady && user) {
            fetchTeam();
        }
    }, [authReady, user]);

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const handleLeave = async () => {
        if (!confirm("Are you sure you want to leave this squad?")) return;
        try {
            setActionLoading("leave");
            const token = getToken();
            await axios.post(
                `${BACKEND_URL}/team/${teamId}/leave`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            router.push("/teams");
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to leave team");
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemoveMember = async (memberId: string, memberName: string) => {
        if (!confirm(`Remove ${memberName} from the squad?`)) return;
        try {
            setActionLoading(memberId);
            const token = getToken();
            await axios.delete(`${BACKEND_URL}/team/${teamId}/members/${memberId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchTeam();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to remove member");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteTeam = async () => {
        try {
            setActionLoading("delete");
            const token = getToken();
            await axios.delete(`${BACKEND_URL}/team/${teamId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            router.push("/teams");
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to delete team");
        } finally {
            setActionLoading(null);
            setShowDeleteConfirm(false);
        }
    };

    if (!authReady || loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="text-[var(--accent)] animate-spin" size={32} />
                    <p className="text-[var(--text-muted)] font-mono text-sm">Loading squad...</p>
                </div>
            </div>
        );
    }

    if (error || !team) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-red-400 text-sm font-mono">{error || "Team not found"}</p>
                    <Link href="/teams" className="text-[var(--accent)] underline text-sm">
                        Back to squads
                    </Link>
                </div>
            </div>
        );
    }

    const isOwner = team.ownerId === user?.id;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]" style={{ fontFamily: "var(--font-syne)" }}>
            {/* Background blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--accent)] opacity-5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500 opacity-5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 mb-12 font-mono text-[0.7rem] uppercase tracking-widest text-[var(--text-muted)]">
                    <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
                    <ChevronRight size={12} className="opacity-20" />
                    <Link href="/teams" className="hover:text-[var(--accent)] transition-colors">Squads</Link>
                    <ChevronRight size={12} className="opacity-20" />
                    <span className="text-[var(--text-primary)]">{team.name}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar — Team Info */}
                    <div className="lg:col-span-4">
                        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-8 sticky top-12">
                            <div className="flex flex-col items-center text-center">
                                {/* Team icon */}
                                <div className="w-20 h-20 rounded-2xl bg-[var(--accent-bg)] border border-[var(--accent-border)] flex items-center justify-center text-[var(--accent)] mb-6">
                                    <Users size={40} />
                                </div>

                                <h1 className="text-2xl font-extrabold mb-2">{team.name}</h1>

                                {isOwner && (
                                    <div className="flex items-center gap-1.5 text-[var(--accent)] font-mono text-[0.65rem] uppercase tracking-widest mb-4 bg-[var(--accent-bg)] px-3 py-1 rounded-full border border-[var(--accent-border)]">
                                        <Crown size={11} /> You are the owner
                                    </div>
                                )}

                                {/* Meta */}
                                <div className="w-full space-y-3 text-left font-mono text-[0.75rem] text-[var(--text-muted)] pt-6 border-t border-[var(--border-secondary)]">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2"><Users size={13} /> Members</span>
                                        <span className="text-[var(--text-primary)]">{team._count.members} / 10</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2"><Calendar size={13} /> Created</span>
                                        <span className="text-[var(--text-primary)]">{new Date(team.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    {/* Invite code */}
                                    <div
                                        className="flex items-center justify-between cursor-pointer group pt-3 border-t border-[var(--border-secondary)]"
                                        onClick={() => copyToClipboard(team.inviteCode)}
                                    >
                                        <span className="flex items-center gap-2"><Shield size={13} /> Invite Code</span>
                                        <span className="flex items-center gap-2 text-[var(--accent)] font-bold tracking-widest">
                                            {team.inviteCode}
                                            {copiedCode ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="opacity-50 group-hover:opacity-100 transition-opacity" />}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="w-full space-y-3 mt-8">
                                    {!isOwner && team.isMember && (
                                        <button
                                            onClick={handleLeave}
                                            disabled={actionLoading === "leave"}
                                            className="w-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 text-red-400 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-40"
                                        >
                                            {actionLoading === "leave" ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
                                            Leave Squad
                                        </button>
                                    )}

                                    {isOwner && (
                                        <button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="w-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 text-red-400 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm font-semibold"
                                        >
                                            <Trash2 size={15} /> Disband Squad
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main — Members List */}
                    <div className="lg:col-span-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold flex items-center gap-3">
                                <Users className="text-[var(--accent)]" size={20} /> Squad Members
                            </h2>
                            <span className="font-mono text-[0.65rem] text-[var(--text-muted)] uppercase tracking-widest">
                                {team._count.members} total
                            </span>
                        </div>

                        <div className="space-y-3">
                            {team.members.map((member) => {
                                const m = member.user;
                                const memberIsOwner = m.id === team.ownerId;
                                const displayName = m.displayName || m.email.split("@")[0];
                                const initial = displayName.charAt(0).toUpperCase();

                                return (
                                    <div
                                        key={member.id}
                                        className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-5 flex items-center justify-between group hover:border-[var(--border-secondary)] transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-black border-2 border-[var(--border-secondary)] shadow-md"
                                                style={{ backgroundColor: m.avatarColor }}
                                            >
                                                {initial}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[0.95rem]">{displayName}</span>
                                                    {memberIsOwner && (
                                                        <span className="flex items-center gap-1 text-[var(--accent)] bg-[var(--accent-bg)] px-2 py-0.5 rounded text-[0.55rem] font-mono uppercase tracking-widest border border-[var(--accent-border)]">
                                                            <Crown size={9} /> Owner
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <span className="font-mono text-[0.68rem] text-[var(--text-muted)]">{m.email}</span>
                                                    <span className="flex items-center gap-1 font-mono text-[0.68rem] text-[var(--accent)]">
                                                        <Star size={10} /> {m.rating}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <span className="font-mono text-[0.6rem] text-[var(--text-muted)]">
                                                Joined {new Date(member.joinedAt).toLocaleDateString()}
                                            </span>

                                            {/* Owner can remove non-owner members */}
                                            {isOwner && !memberIsOwner && (
                                                <button
                                                    onClick={() => handleRemoveMember(m.id, displayName)}
                                                    disabled={actionLoading === m.id}
                                                    className="p-2 rounded-lg text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all disabled:opacity-40"
                                                    title="Remove member"
                                                >
                                                    {actionLoading === m.id ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <UserMinus size={16} />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                    <div className="bg-[var(--bg-card)] border border-red-500/30 rounded-2xl p-8 max-w-md w-full shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                                <Trash2 className="text-red-400" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Disband Squad</h3>
                                <p className="text-red-400 text-[0.7rem] font-mono">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-[var(--text-muted)] text-sm mb-8">
                            This will permanently delete <strong className="text-[var(--text-primary)]">{team.name}</strong> and remove all {team._count.members} member(s). All associated data will be lost.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-3 rounded-xl border border-[var(--border-secondary)] text-[var(--text-muted)] font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteTeam}
                                disabled={actionLoading === "delete"}
                                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-40"
                            >
                                {actionLoading === "delete" ? <Loader2 className="animate-spin" size={18} /> : "Confirm Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
