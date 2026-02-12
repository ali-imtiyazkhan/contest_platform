"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Clock, Trophy, ArrowRight, Zap } from "lucide-react"

type Difficulty = "Easy" | "Medium" | "Hard"

export type ContestCardProps = {
  title: string
  description: string
  difficulty: Difficulty
  live?: boolean
  timeLeft?: string
  startsAt?: string
  className?: string
  id: string
}

// Difficulty Pill
function DiffPill({ difficulty }: { difficulty: Difficulty }) {
  const styles = {
    Easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Hard: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        styles[difficulty]
      )}
    >
      {difficulty}
    </span>
  )
}

export function ContestCard({
  title,
  description,
  difficulty,
  live = false,
  timeLeft,
  startsAt,
  className,
  id,
}: ContestCardProps) {
  const [started, setStarted] = useState(false)
  const router = useRouter()

  const handleOpen = () => {
    router.push(`/contest/${id}`)
  }

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card
        role="link"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleOpen()
        }}
        className={cn(
          "group relative flex h-full cursor-pointer flex-col overflow-hidden border-zinc-800 bg-zinc-950/50 backdrop-blur-sm transition-all hover:border-orange-500/30 hover:shadow-[0_0_30px_rgba(249,115,22,0.1)]",
          className
        )}
        aria-label={`Open contest ${title}`}
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-orange-500/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-orange-500">
              <Trophy size={16} />
            </div>
            <DiffPill difficulty={difficulty} />
          </div>

          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-zinc-100 group-hover:text-white transition-colors">
              {title}
            </CardTitle>
            <CardDescription className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-400">
              {description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            {live ? (
              <div className="flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1 text-[11px] font-medium text-orange-500">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
                </span>
                LIVE NOW {timeLeft ? `• ${timeLeft}` : ""}
              </div>
            ) : startsAt ? (
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Clock size={14} />
                <span>Starts {startsAt}</span>
              </div>
            ) : null}
          </div>

          {started && (
            <div className="flex items-center gap-2 rounded-lg border border-blue-500/10 bg-blue-500/5 p-2 text-xs text-blue-400">
              <Zap size={14} fill="currentColor" />
              Status: In progress
            </div>
          )}
        </CardContent>

        <CardFooter className="mt-auto border-t border-zinc-900/50 pt-4">
          <Button
            className={cn(
              "w-full gap-2 transition-all duration-300",
              started
                ? "bg-zinc-800 text-zinc-400"
                : "bg-white text-black hover:bg-orange-500 hover:text-white"
            )}
            onClick={(e) => {
              e.stopPropagation()
              setStarted(true)
              handleOpen()
            }}
            disabled={started}
          >
            {started ? (
              "Continuing..."
            ) : (
              <>
                Start Challenge
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </>
            )}
          </Button>
        </CardFooter>

        {/* Decorative corner glow */}
        <div className="absolute -bottom-12 -right-12 h-24 w-24 rounded-full bg-orange-500/5 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />
      </Card>
    </motion.div>
  )
}
