"use client"

import type React from "react"
import { useState } from "react"
import {
  Plus,
  Trash2,
  ShieldCheck,
  Zap,
  Loader2,
  Clock,
  Settings2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SiteHeader } from "@/components/site-header"
import { useAuth } from "@/context/AuthProvider"
import { useRouter } from "next/navigation"

type Difficulty = "Easy" | "Medium" | "Hard"

type SubChallenge = {
  title: string
  points: number
  description: string
  notionDocId: string
  type: Difficulty
}

export default function AdminPage() {
  const { toast } = useToast()
  const { accessToken, user } = useAuth()
  const router = useRouter();

  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [scheduled, setScheduled] = useState(false)
  const [startAt, setStartAt] = useState("")
  const [endAt, setEndAt] = useState("")

  if (!accessToken || user?.role !== "Admin") {
    toast({
      title: "Unauthorized",
      description: "Admin access required.",
      variant: "destructive",
    })
    router.push("/signin")
    return
  }

  const [subs, setSubs] = useState<SubChallenge[]>([
    {
      title: "Warm-up task",
      points: 100,
      description: "demo test",
      notionDocId: "123abc",
      type: "Easy",
    },
  ])

  const addSub = () =>
    setSubs((s) => [
      ...s,
      {
        title: "",
        points: 100,
        description: "",
        notionDocId: "",
        type: "Easy",
      },
    ])

  const removeSub = (idx: number) =>
    setSubs((s) => s.filter((_, i) => i !== idx))

  const updateSub = (idx: number, patch: Partial<SubChallenge>) =>
    setSubs((s) =>
      s.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!accessToken) {
      toast({
        title: "Unauthorized",
        description: "Admin token missing.",
        variant: "destructive",
      })
      return
    }


    if (scheduled) {
      if (!startAt || !endAt) {
        toast({
          title: "Missing Date",
          description: "Please select both start and end time.",
          variant: "destructive",
        })
        return
      }

      if (new Date(startAt) >= new Date(endAt)) {
        toast({
          title: "Invalid Date",
          description: "End time must be after start time.",
          variant: "destructive",
        })
        return
      }
    }

    setLoading(true)

    try {
      // CREATE CONTEST
      const contestRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/contest/admin/contest`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            title: name,
            description,
            startTime:
              scheduled && startAt
                ? new Date(startAt).toISOString()
                : new Date().toISOString(),
            endTime:
              scheduled && endAt
                ? new Date(endAt).toISOString()
                : new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          }),
        }
      )

      const contestJson = await contestRes.json()
      if (!contestRes.ok || !contestJson.ok)
        throw new Error("Contest creation failed")

      const contestId = contestJson.contest.id

      // CREATE CHALLENGES
      for (let i = 0; i < subs.length; i++) {
        const sc = subs[i]

        const challengeRes = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/contest/admin/challenge`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              title: sc.title,
              description: sc.description,
              maxPoints: sc.points,
              notionDocId: sc.notionDocId,
              type: sc.type,
            }),
          }
        )

        const challengeJson = await challengeRes.json()
        if (!challengeRes.ok || !challengeJson.ok)
          throw new Error("Challenge creation failed")

        await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/contest/admin/contest/${contestId}/challenge`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              challengeId: challengeJson.challenge.id,
              index: i,
            }),
          }
        )
      }

      toast({
        title: "Deployment Successful",
        description: "Contest arena is now live.",
      })

      setName("")
      setDescription("")
      setSubs([])
    } catch (err: any) {
      toast({
        title: "Deployment Failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
      <SiteHeader />

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-10">

        {/* HEADER */}
        <div className="flex justify-between items-center border-b border-zinc-900 pb-8">
          <h1 className="text-4xl font-black flex items-center gap-3">
            <ShieldCheck className="text-emerald-500 h-10 w-10" />
            COMMAND CENTER
          </h1>

          <Button
            onClick={submit}
            disabled={loading || !name}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg"
          >
            {loading ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              <Zap className="mr-2" />
            )}
            Publish Arena
          </Button>
        </div>

        {/* CONTEST CONFIG */}
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="text-emerald-500" />
              Contest Configuration
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">

            <Input
              placeholder="Arena Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-black border-zinc-800"
            />

            <Textarea
              placeholder="Briefing..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-black border-zinc-800"
            />

            <Separator className="bg-zinc-800" />

            {/* Scheduling */}
            <div className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-lg border border-zinc-800">
              <div>
                <Label className="text-sm font-bold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-500" />
                  Enable Scheduling
                </Label>
                <p className="text-xs text-zinc-500">
                  Set custom start and end time
                </p>
              </div>
              <Switch checked={scheduled} onCheckedChange={setScheduled} />
            </div>

            {scheduled && (
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="bg-black border-zinc-800"
                />
                <Input
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  className="bg-black border-zinc-800"
                />
              </div>
            )}

          </CardContent>
        </Card>

        {/* CHALLENGES */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold">
              TASK MODULES
              <Badge className="ml-2">{subs.length}</Badge>
            </h3>
            <Button onClick={addSub}>
              <Plus className="mr-2" />
              Add Challenge
            </Button>
          </div>

          {subs.map((sc, idx) => (
            <Card key={idx} className="bg-zinc-950 border-zinc-800">
              <CardContent className="space-y-4 pt-6">
                <Input
                  placeholder="Challenge Title"
                  value={sc.title}
                  onChange={(e) =>
                    updateSub(idx, { title: e.target.value })
                  }
                />

                <Textarea
                  placeholder="Challenge Description"
                  value={sc.description}
                  onChange={(e) =>
                    updateSub(idx, { description: e.target.value })
                  }
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Notion Doc ID"
                    value={sc.notionDocId}
                    onChange={(e) =>
                      updateSub(idx, { notionDocId: e.target.value })
                    }
                  />

                  <Input
                    type="number"
                    value={sc.points}
                    onChange={(e) =>
                      updateSub(idx, { points: Number(e.target.value) })
                    }
                  />
                </div>

                <select
                  value={sc.type}
                  onChange={(e) =>
                    updateSub(idx, { type: e.target.value as Difficulty })
                  }
                  className="bg-black border border-zinc-800 p-2 rounded-md"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>

                <Button
                  variant="destructive"
                  onClick={() => removeSub(idx)}
                >
                  <Trash2 className="mr-2" />
                  Remove
                </Button>
              </CardContent>
            </Card>
          ))}

        </div>

      </main>
    </div>
  )
}
