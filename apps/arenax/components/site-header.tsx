"use client"

import React, { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthProvider"
import { useTheme } from "@/context/ThemeContext"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Key, LogOut, ShieldCheck, LayoutDashboard, Sun, Moon } from "lucide-react"

export function SiteHeader() {
    const { loading, logout, accessToken, user } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const router = useRouter()
    const [logoutLoading, setLogoutLoading] = useState(false)
    const [apiKey, setApiKey] = useState("")

    const handleLogout = async () => {
        if (logoutLoading) return
        setLogoutLoading(true)
        try {
            await logout()
            router.push("/signin")
        } catch (error) {
            console.error("Logout failed:", error)
        } finally {
            setLogoutLoading(false)
        }
    }

    const handleChangeApi = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setApiKey(value)
        localStorage.setItem("aiApiKey", value)
    }

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-0 z-50 w-full border-b border-[var(--border-primary)] bg-[var(--header-bg)] backdrop-blur-xl"
        >
            <div className="flex h-16 max-w-full mx-auto items-center justify-between px-4 sm:px-8">

                {/* Logo Section */}
                <Link
                    href={accessToken ? "/dashboard" : "/signin"}
                    className="group relative flex items-center gap-3"
                    aria-label="ArenaX home"
                >
                    <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--bg-tertiary)] to-[var(--bg-primary)] border border-[var(--border-secondary)] transition-all duration-300 group-hover:border-[var(--accent)] group-hover:shadow-[0_0_15px_var(--accent-border)]">
                        <svg
                            className="h-5 w-5 text-[var(--accent)] transition-transform duration-500 group-hover:rotate-180"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
                            <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-lg font-bold leading-none tracking-tight text-[var(--text-primary)]">
                            Arena<span className="text-[var(--accent)]">X</span>
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">Platform</span>
                    </div>
                </Link>

                {/* Navigation & Actions */}
                <nav className="flex items-center gap-4 sm:gap-6">
                    {loading ? (
                        <div className="flex items-center gap-4">
                            <div className="h-4 w-16 animate-pulse rounded-full bg-[var(--bg-card)]" />
                            <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--bg-card)]" />
                        </div>
                    ) : accessToken ? (
                        <>
                            {/* Desktop Links */}
                            <div className="hidden items-center gap-1 md:flex">
                                <NavLink href="/dashboard" icon={<LayoutDashboard size={14} />}>Dashboard</NavLink>
                                {user?.role === "Admin" && (
                                    <NavLink href="/admin" icon={<ShieldCheck size={14} />}>Admin</NavLink>
                                )}
                            </div>

                            {/* Theme Toggle in Header */}
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] transition-all"
                                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                            >
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>

                            {/* API Key Input - Styled */}
                            <div className="relative hidden lg:block group">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors" />
                                <input
                                    type="password"
                                    placeholder="AI API Key"
                                    value={apiKey}
                                    onChange={handleChangeApi}
                                    className="h-9 w-48 rounded-full border border-[var(--border-secondary)] bg-[var(--bg-secondary)] pl-9 pr-4 text-xs text-[var(--text-primary)] transition-all focus:w-64 focus:border-[var(--accent-border)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-border)] placeholder:text-[var(--text-muted)]"
                                />
                            </div>

                            <div className="flex items-center gap-4 border-l border-[var(--border-primary)] pl-4 sm:pl-6">
                                <div className="flex items-center gap-3 group cursor-pointer">
                                    <div className="hidden text-right lg:block">
                                        <p className="text-xs font-medium text-[var(--text-primary)]">{user?.email?.split('@')[0]}</p>
                                        <p className="text-[10px] text-[var(--text-muted)]">Member</p>
                                    </div>
                                    <Avatar className="h-9 w-9 border border-[var(--border-secondary)] ring-offset-[var(--bg-primary)] transition-all group-hover:ring-2 group-hover:ring-[var(--accent-border)]">
                                        <AvatarFallback className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)] text-[10px] font-bold text-[var(--accent)]">
                                            {user?.email?.[0]?.toUpperCase() ?? "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>

                                <motion.div whileTap={{ scale: 0.95 }}>
                                    <Button
                                        onClick={handleLogout}
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 gap-2 px-3 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition-all"
                                        disabled={logoutLoading}
                                    >
                                        {logoutLoading ? (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--text-muted)] border-t-transparent" />
                                        ) : (
                                            <>
                                                <LogOut size={16} />
                                                <span className="hidden sm:inline">Logout</span>
                                            </>
                                        )}
                                    </Button>
                                </motion.div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] transition-all"
                                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                            >
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button asChild size="sm" className="rounded-full bg-[var(--accent)] px-6 font-semibold text-[var(--accent-text-on)] hover:opacity-90 shadow-[0_0_20px_var(--accent-border)] border-none">
                                    <Link href="/signin">Sign in</Link>
                                </Button>
                            </motion.div>
                        </div>
                    )}
                </nav>
            </div>
        </motion.header>
    )
}

function NavLink({
    href,
    children,
    icon,
}: {
    href: string
    children: React.ReactNode
    icon?: React.ReactNode
}) {
    return (
        <Link
            href={href}
            className="group relative flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        >
            {icon && <span className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">{icon}</span>}
            {children}
            {/* Hover Underline Animation */}
            <motion.div
                className="absolute bottom-0 left-0 h-0.5 bg-[var(--accent)] w-0 group-hover:w-full transition-all duration-300"
                layoutId="nav-underline"
            />
        </Link>
    )
}
