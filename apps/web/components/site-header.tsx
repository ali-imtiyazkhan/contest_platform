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
    <header className="sticky top-0 z-50 border-b  backdrop-blur">
      <div className="mx-auto flex h-16 max-w-8xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href={accessToken ? "/dashboard" : "/signin"}
          className="group flex items-center gap-2"
          aria-label="100xContest home"
        >
          <svg
            className="h-7 w-7 text-primary transition-transform duration-200 group-hover:rotate-6"
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
              strokeWidth="1.6"
            />
            <path
              d="M8 8l8 8M16 8l-8 8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>

          <span className="text-lg font-semibold tracking-tight">
            <span>100x</span>
            <span className="ml-1 text-muted-foreground">Contest</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-9 w-20 animate-pulse rounded bg-muted" />
            </div>
          ) : accessToken ? (
            <>
              <NavLink href="/dashboard">Dashboard</NavLink>

              {user?.role === "Admin" && (
                <NavLink href="/admin">Admin</NavLink>
              )}

              {/* User */}
              <div className="flex items-center gap-3 pl-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-[10px]">
                    {user?.email?.[0]?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>

                <span className="hidden text-sm text-muted-foreground md:block">
                  {user?.email}
                </span>

                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  disabled={logoutLoading}
                >
                  {logoutLoading ? "Logging out..." : "Logout"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button asChild size="sm">
                <Link href="/signin">Sign in</Link>
              </Button>
            </>
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
      className="text-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4"
    >
      {children}
    </Link>
  )
}
