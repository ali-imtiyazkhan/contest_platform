"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Trophy,
    Target,
    Zap,
    MapPin,
    Mail,
    Edit3,
    ChevronRight,
    TrendingUp,
    Award,
    X,
    Check,
    Loader2,
    LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthProvider";

import { BACKEND_URL as API_BASE } from "@/config";

interface UserProfile {
    id: string;
    email: string;
    displayName: string | null;
    country: string | null;
    avatarColor: string;
    rating: number;
    contestsPlayed: number;
    totalPoints: number;
    rank: number;
}

const AVATAR_COLORS = [
    "#c8f135", "#f135c8", "#35c8f1", "#f1a035",
    "#a035f1", "#35f1a0", "#f13535", "#3578f1",
];

const COUNTRY_NAMES: Record<string, string> = {
    IN: "🇮🇳 India", US: "🇺🇸 United States", GB: "🇬🇧 United Kingdom",
    DE: "🇩🇪 Germany", FR: "🇫🇷 France", JP: "🇯🇵 Japan",
    CA: "🇨🇦 Canada", AU: "🇦🇺 Australia", BR: "🇧🇷 Brazil",
    PK: "🇵🇰 Pakistan", NG: "🇳🇬 Nigeria", BD: "🇧🇩 Bangladesh",
};

export default function ProfilePage() {
    const router = useRouter();
    const { accessToken, authReady, logout } = useAuth();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Edit modal state
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({ displayName: "", country: "", avatarColor: "" });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    // Fetch profile
    useEffect(() => {
        if (!authReady) return;

        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/signin");
            return;
        }

        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API_BASE}/user/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!res.ok || !data.ok) {
                    throw new Error(data.message || "Failed to load profile");
                }
                setProfile(data.data);
            } catch (err: any) {
                setError(err.message || "Something went wrong");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [authReady]);

    const openEdit = () => {
        if (!profile) return;
        setEditForm({
            displayName: profile.displayName || "",
            country: profile.country || "",
            avatarColor: profile.avatarColor,
        });
        setSaveError("");
        setEditing(true);
    };

    const saveProfile = async () => {
        setSaving(true);
        setSaveError("");
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API_BASE}/user/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(editForm),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                throw new Error(data.message || "Update failed");
            }
            setProfile(prev => prev ? { ...prev, ...data.data } : prev);
            setEditing(false);
        } catch (err: any) {
            setSaveError(err.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    if (!authReady || loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="text-[var(--accent)] animate-spin" size={32} />
                    <p className="text-[var(--text-muted)] font-mono text-sm">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-red-400 text-sm font-mono">{error}</p>
                    <button onClick={() => router.push("/signin")} className="text-[var(--accent)] underline text-sm">
                        Sign in again
                    </button>
                </div>
            </div>
        );
    }

    if (!profile) return null;

    const initial = profile.displayName?.[0]?.toUpperCase() || profile.email[0].toUpperCase();
    const countryLabel = profile.country ? (COUNTRY_NAMES[profile.country] || profile.country) : "Not specified";

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]" style={{ fontFamily: "var(--font-syne)" }}>
            {/* Background blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--accent)] opacity-5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500 opacity-5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 mb-12 font-mono text-[0.7rem] uppercase tracking-widest text-[var(--text-muted)]">
                    <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
                    <ChevronRight size={12} className="opacity-20" />
                    <span className="text-[var(--text-primary)]">Profile</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-8 sticky top-12">
                            <div className="flex flex-col items-center text-center">
                                {/* Avatar */}
                                <div
                                    className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold mb-6 border-2 border-[var(--border-secondary)] shadow-[0_0_40px_rgba(200,241,53,0.1)]"
                                    style={{ backgroundColor: profile.avatarColor, color: "#000" }}
                                >
                                    {initial}
                                </div>

                                <h1 className="text-2xl font-extrabold mb-1">
                                    {profile.displayName || "Anonymous User"}
                                </h1>
                                <p className="font-mono text-[0.78rem] text-[var(--text-muted)] mb-6 flex items-center gap-2">
                                    <Mail size={13} /> {profile.email}
                                </p>

                                {/* Rating & Rank chips */}
                                <div className="w-full flex justify-center gap-4 mb-8">
                                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-xl px-4 py-3 flex-1 text-center">
                                        <div className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--text-muted)] mb-1">Rating</div>
                                        <div className="text-[var(--accent)] font-bold text-xl">{profile.rating}</div>
                                    </div>
                                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-xl px-4 py-3 flex-1 text-center">
                                        <div className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--text-muted)] mb-1">Rank</div>
                                        <div className="text-[var(--text-primary)] font-bold text-xl">#{profile.rank}</div>
                                    </div>
                                </div>

                                {/* Meta */}
                                <div className="w-full space-y-3 text-left font-mono text-[0.75rem] text-[var(--text-muted)] pt-6 border-t border-[var(--border-secondary)]">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2"><MapPin size={13} /> Location</span>
                                        <span className="text-[var(--text-primary)]">{countryLabel}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2"><Trophy size={13} /> Contests</span>
                                        <span className="text-[var(--text-primary)]">{profile.contestsPlayed} played</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2"><Zap size={13} /> Points</span>
                                        <span className="text-[var(--accent)] font-semibold">{profile.totalPoints.toLocaleString()}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={openEdit}
                                    className="w-full mt-8 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-bg)] text-[var(--text-primary)] py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm font-semibold"
                                >
                                    <Edit3 size={15} /> Edit Profile
                                </button>

                                <button
                                    onClick={async () => {
                                        await logout();
                                        router.push("/signin");
                                    }}
                                    className="w-full mt-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 text-red-400 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm font-semibold"
                                >
                                    <LogOut size={15} /> Logout
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: "Total Points", value: profile.totalPoints.toLocaleString(), Icon: Zap, color: "text-[var(--accent)]" },
                                { label: "Contests Played", value: profile.contestsPlayed, Icon: Trophy, color: "text-orange-400" },
                                { label: "Global Rank", value: `#${profile.rank}`, Icon: Target, color: "text-blue-400" },
                            ].map(({ label, value, Icon, color }) => (
                                <div key={label} className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-6 rounded-2xl group hover:border-[var(--border-secondary)] transition-colors relative overflow-hidden">
                                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                        <Icon size={120} />
                                    </div>
                                    <Icon className={`${color} mb-4`} size={24} />
                                    <div className="font-mono text-[0.62rem] uppercase tracking-[2px] text-[var(--text-muted)] mb-1">{label}</div>
                                    <div className="text-2xl font-extrabold">{value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Rating progress placeholder */}
                        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold flex items-center gap-3">
                                    <TrendingUp className="text-[var(--accent)]" size={20} /> Rating Progress
                                </h3>
                                <div className="flex gap-2">
                                    {["1M", "3M", "6M", "ALL"].map(t => (
                                        <button key={t} className="px-3 py-1 rounded-full text-[0.6rem] font-mono border border-[var(--border-secondary)] hover:border-[var(--accent-border)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-all">{t}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Simple rating bar visualization */}
                            <div className="space-y-2">
                                <div className="flex justify-between font-mono text-[0.65rem] text-[var(--text-muted)]">
                                    <span>Current Rating</span>
                                    <span className="text-[var(--accent)] font-bold">{profile.rating}</span>
                                </div>
                                <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent)] rounded-full transition-all duration-700"
                                        style={{ width: `${Math.min((profile.rating / 3000) * 100, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between font-mono text-[0.58rem] text-[var(--text-muted)] opacity-50">
                                    <span>0 — Newcomer</span>
                                    <span>3000 — Grandmaster</span>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-3 gap-4">
                                {[
                                    { label: "Novice", range: "< 1200", active: profile.rating < 1200 },
                                    { label: "Intermediate", range: "1200–1800", active: profile.rating >= 1200 && profile.rating < 1800 },
                                    { label: "Expert", range: "1800+", active: profile.rating >= 1800 },
                                ].map(tier => (
                                    <div key={tier.label} className={`p-3 rounded-xl border text-center transition-all ${tier.active ? "border-[var(--accent-border)] bg-[var(--accent-bg)]" : "border-[var(--border-secondary)] opacity-40"}`}>
                                        <div className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--text-muted)] mb-1">{tier.range}</div>
                                        <div className={`text-sm font-bold ${tier.active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}>{tier.label}</div>
                                        {tier.active && <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mx-auto mt-1" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Achievements */}
                        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-8">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                                <Award className="text-[var(--accent)]" size={20} /> Achievements
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                {[
                                    { name: "First Solve", earned: profile.contestsPlayed >= 1, color: "bg-[var(--accent)]" },
                                    { name: "5 Contests", earned: profile.contestsPlayed >= 5, color: "bg-blue-500" },
                                    { name: "Top 100", earned: profile.rank <= 100, color: "bg-orange-500" },
                                    { name: "1200+ Rating", earned: profile.rating >= 1200, color: "bg-purple-500" },
                                ].map((a) => (
                                    <div key={a.name} className={`flex flex-col items-center text-center group cursor-help ${a.earned ? "" : "opacity-30"}`} title={a.earned ? "Unlocked!" : "Not yet unlocked"}>
                                        <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform relative">
                                            <div className={`w-8 h-8 rounded-full ${a.color} blur-[12px] ${a.earned ? "opacity-30" : "opacity-0"} absolute`} />
                                            <Trophy size={28} className={a.earned ? "text-[var(--accent)]" : "text-[var(--text-muted)]"} />
                                        </div>
                                        <span className="font-mono text-[0.62rem] text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">{a.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {editing && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditing(false)} />
                    <div className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-8 shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-extrabold">Edit Profile</h3>
                            <button onClick={() => setEditing(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-5">
                            {/* Display Name */}
                            <div className="space-y-2">
                                <label className="block font-mono text-[0.7rem] text-[var(--text-muted)] tracking-[2px] uppercase">Display Name</label>
                                <input
                                    type="text"
                                    value={editForm.displayName}
                                    onChange={e => setEditForm({ ...editForm, displayName: e.target.value })}
                                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent-border)] transition-all"
                                    placeholder="Your display name"
                                />
                            </div>

                            {/* Country */}
                            <div className="space-y-2">
                                <label className="block font-mono text-[0.7rem] text-[var(--text-muted)] tracking-[2px] uppercase">Country</label>
                                <select
                                    value={editForm.country}
                                    onChange={e => setEditForm({ ...editForm, country: e.target.value })}
                                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent-border)] transition-all"
                                >
                                    <option value="">Not specified</option>
                                    {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
                                        <option key={code} value={code}>{name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Avatar Color */}
                            <div className="space-y-2">
                                <label className="block font-mono text-[0.7rem] text-[var(--text-muted)] tracking-[2px] uppercase">Avatar Color</label>
                                <div className="flex gap-3 flex-wrap">
                                    {AVATAR_COLORS.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setEditForm({ ...editForm, avatarColor: color })}
                                            className="w-9 h-9 rounded-full transition-transform hover:scale-110 relative"
                                            style={{ backgroundColor: color }}
                                        >
                                            {editForm.avatarColor === color && (
                                                <Check size={16} className="absolute inset-0 m-auto text-black" strokeWidth={3} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {/* Preview */}
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: editForm.avatarColor, color: "#000" }}>
                                        {initial}
                                    </div>
                                    <span className="font-mono text-[0.7rem] text-[var(--text-muted)]">Preview</span>
                                </div>
                            </div>

                            {saveError && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                                    {saveError}
                                </div>
                            )}

                            <button
                                onClick={saveProfile}
                                disabled={saving}
                                className="w-full bg-[var(--accent)] text-[var(--accent-text-on)] font-extrabold text-sm tracking-[2px] uppercase py-4 rounded-lg hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                            >
                                {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : "Save Changes →"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
