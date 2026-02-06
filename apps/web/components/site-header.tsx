"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthProvider"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function SiteHeader() {
  const { loading, logout, accessToken, user } = useAuth()
  const router = useRouter()
  const [logoutLoading, setLogoutLoading] = useState(false)

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

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-900 bg-black/80 backdrop-blur-md">
      <div className=" flex h-16 max-w-full items-center justify-between px-6 sm:px-8 lg:px-12">
        {/* Logo */}
        <Link
          href={accessToken ? "/dashboard" : "/signin"}
          className="group flex items-center gap-2"
          aria-label="100xContest home"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 transition-all group-hover:border-orange-500/50">
            <svg
              className="h-5 w-5 text-orange-500 transition-transform duration-300 group-hover:scale-110"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="5"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M8 8l8 8M16 8l-8 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <span className="text-xl font-bold tracking-tight text-white">
            <span>100x</span>
            <span className="ml-1 text-zinc-500 font-medium">Contest</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="h-4 w-20 animate-pulse rounded bg-zinc-800" />
              <div className="h-8 w-20 animate-pulse rounded bg-zinc-800" />
            </div>
          ) : accessToken ? (
            <>
              <div className="hidden items-center gap-6 md:flex">
                <NavLink href="/dashboard">Dashboard</NavLink>
                {user?.role === "Admin" && (
                  <NavLink href="/admin">Admin Control</NavLink>
                )}
              </div>

              {/* User Section */}
              <div className="flex items-center gap-4 border-l border-zinc-800 pl-6">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border border-zinc-800 bg-zinc-900">
                    <AvatarFallback className="text-[10px] font-bold text-zinc-400">
                      {user?.email?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>

                  <span className="hidden text-sm font-medium text-zinc-400 lg:block">
                    {user?.email}
                  </span>
                </div>

                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="text-zinc-500 hover:bg-zinc-900 hover:text-white transition-colors"
                  disabled={logoutLoading}
                >
                  {logoutLoading ? "..." : "Logout"}
                </Button>
              </div>
            </>
          ) : (
            <Button asChild size="sm" className="bg-white text-black hover:bg-zinc-200">
              <Link href="/signin">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}

/* ================= Reusable NavLink ================= */

function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-zinc-400 transition-colors hover:text-white focus-visible:outline-none"
    >
      {children}
    </Link>
  )
}