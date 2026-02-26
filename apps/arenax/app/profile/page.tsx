"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    User,
    Trophy,
    Target,
    Zap,
    MapPin,
    Mail,
    Calendar,
    Edit3,
    ChevronRight,
    TrendingUp,
    Award
} from "lucide-react";

interface UserProfile {
    id: string;
    email: string;
    displayName: string | null;
    country: string | null;
    avatarColor: string;
    rating: number;
    joinedAt: string;
    contestsPlayed: number;
    totalPoints: number;
    rank: number;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Mock data for initial design - will connect to backend later
    useEffect(() => {
        setTimeout(() => {
            setProfile({
                id: "1",
                email: "itzkhantijara@gmail.com",
                displayName: "Imtiyaz Khan",
                country: "IN",
                avatarColor: "#c8f135",
                rating: 1450,
                joinedAt: "2024-01-15T00:00:00Z",
                contestsPlayed: 12,
                totalPoints: 24500,
                rank: 124
            });
            setLoading(false);
        }, 1000);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="text-acid text-xl font-mono animate-pulse">Initializing Profile...</div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-cream selection:bg-acid selection:text-black">
            {/* Premium Gradient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-acid/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 mb-12 font-mono text-[0.7rem] uppercase tracking-widest text-muted">
                    <Link href="/" className="hover:text-acid transition-colors">Home</Link>
                    <ChevronRight size={12} className="text-white/20" />
                    <span className="text-cream">Profile</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar / Main Info */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-8 sticky top-12">
                            <div className="flex flex-col items-center text-center">
                                <div
                                    className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold mb-6 border-2 border-white/[0.08] shadow-[0_0_40px_rgba(200,241,53,0.1)]"
                                    style={{ backgroundColor: profile.avatarColor, color: '#000' }}
                                >
                                    {profile.displayName?.[0] || profile.email[0].toUpperCase()}
                                </div>
                                <h1 className="text-2xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-b from-cream to-cream/60">
                                    {profile.displayName || "Anonymous User"}
                                </h1>
                                <p className="font-mono text-[0.8rem] text-muted mb-6 flex items-center gap-2">
                                    <Mail size={14} /> {profile.email}
                                </p>

                                <div className="w-full flex justify-center gap-4 mb-8">
                                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 flex-1">
                                        <div className="font-mono text-[0.6rem] uppercase tracking-widest text-muted mb-1">Rating</div>
                                        <div className="text-acid font-bold text-xl">{profile.rating}</div>
                                    </div>
                                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 flex-1">
                                        <div className="font-mono text-[0.6rem] uppercase tracking-widest text-muted mb-1">Rank</div>
                                        <div className="text-cream font-bold text-xl">#{profile.rank}</div>
                                    </div>
                                </div>

                                <div className="w-full space-y-4 text-left font-mono text-[0.75rem] text-muted pt-6 border-t border-white/[0.06]">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2"><MapPin size={14} /> Location</span>
                                        <span className="text-cream">{profile.country || "Not specified"}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2"><Calendar size={14} /> Joined</span>
                                        <span className="text-cream">{new Date(profile.joinedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <button className="w-full mt-8 bg-white/[0.05] border border-white/[0.08] hover:border-acid/40 hover:bg-acid/5 text-cream py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm font-semibold">
                                    <Edit3 size={16} /> Edit Profile
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Stats Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: "Total Points", value: profile.totalPoints.toLocaleString(), icon: Zap, color: "text-acid" },
                                { label: "Contests Played", value: profile.contestsPlayed, icon: Trophy, color: "text-orange-400" },
                                { label: "Global Percentile", value: "Top 2%", icon: Target, color: "text-blue-400" }
                            ].map((stat, i) => (
                                <div key={i} className="bg-[#111113] border border-white/[0.06] p-6 rounded-2xl group hover:border-white/[0.12] transition-colors relative overflow-hidden">
                                    <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity`}>
                                        <stat.icon size={120} />
                                    </div>
                                    <stat.icon className={`${stat.color} mb-4`} size={24} />
                                    <div className="font-mono text-[0.62rem] uppercase tracking-[2px] text-muted mb-1">{stat.label}</div>
                                    <div className="text-2xl font-extrabold text-cream">{stat.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Performance Chart Placeholder */}
                        <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-lg font-bold flex items-center gap-3">
                                    <TrendingUp className="text-acid" size={20} /> Rating Progress
                                </h3>
                                <div className="flex gap-2">
                                    {['1M', '3M', '6M', 'ALL'].map(t => (
                                        <button key={t} className="px-3 py-1 rounded-full text-[0.6rem] font-mono border border-white/[0.08] hover:border-acid/40 text-muted hover:text-acid transition-all">
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="h-[240px] w-full bg-white/[0.02] border border-dashed border-white/[0.08] rounded-xl flex items-center justify-center text-muted font-mono text-[0.7rem]">
                                Rating visualization canvas
                            </div>
                        </div>

                        {/* Achievements & Badges */}
                        <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-8">
                            <h3 className="text-lg font-bold mb-8 flex items-center gap-3">
                                <Award className="text-acid" size={20} /> Achievements
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                {[
                                    { name: "First Solve", color: "bg-acid" },
                                    { name: "Consistency", color: "bg-blue-500" },
                                    { name: "Top 100", color: "bg-orange-500" },
                                    { name: "Speed Demon", color: "bg-purple-500" }
                                ].map((a, i) => (
                                    <div key={i} className="flex flex-col items-center text-center group cursor-help">
                                        <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <div className={`w-8 h-8 rounded-full ${a.color} blur-[12px] opacity-20 absolute`} />
                                            <Trophy size={28} className="text-muted group-hover:text-cream transition-colors" />
                                        </div>
                                        <span className="font-mono text-[0.62rem] text-muted group-hover:text-cream">{a.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Bebas+Neue&display=swap');
        
        body {
          font-family: 'Syne', sans-serif;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(200, 241, 53, 0.2);
          border-radius: 2px;
        }
      `}</style>
        </div>
    );
}
