"use client"

import type React from "react"
import { useState } from "react"
import {
  Plus,
  Trash2,
  Calendar,
  Trophy,
  FileText,
  Settings2,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Zap,
  Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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

type SubChallenge = {
  title: string
  points: number
  description: string
  notionDocId: string
}

export default function AdminPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [scheduled, setScheduled] = useState(false)
  const [startAt, setStartAt] = useState("")
  const [endAt, setEndAt] = useState("")

  const [subs, setSubs] = useState<SubChallenge[]>([
    { title: "Warm-up task", points: 100, description: "demo test", notionDocId: "123abc" },
  ])

  const addSub = () =>
    setSubs((s) => [...s, { title: "", points: 100, description: "", notionDocId: "" }])

  const removeSub = (idx: number) => setSubs((s) => s.filter((_, i) => i !== idx))

  const updateSub = (idx: number, patch: Partial<SubChallenge>) =>
    setSubs((s) => s.map((item, i) => (i === idx ? { ...item, ...patch } : item)))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const contestRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/contest/admin/contest`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: name,
          description,
          startTime: scheduled && startAt ? new Date(startAt).toISOString() : new Date().toISOString(),
        }),
      })

      const contestJson = await contestRes.json()
      if (!contestJson.ok) throw new Error("Contest creation failed")
      const contestId = contestJson.contest.id

      for (let i = 0; i < subs.length; i++) {
        const sc = subs[i]
        const challengeRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/contest/admin/challenge`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: sc.title,
            description: sc.description,
            maxPoints: sc.points,
            notionDocId: sc.notionDocId,
          }),
        })

        const challengeJson = await challengeRes.json()
        if (challengeJson.ok) {
          await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/contest/admin/contest/${contestId}/challenge`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ challengeId: challengeJson.challenge.id, index: i }),
          })
        }
      }

      toast({ title: "Deployment Successful", description: "Contest arena is now live." })
    } catch (err: any) {
      toast({ title: "Deployment Failed", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
      <SiteHeader />

      <main className="max-w-full mx-auto px-6 py-12 space-y-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-900 pb-10">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-3">
              <ShieldCheck className="text-emerald-500 h-10 w-10" />
              COMMAND CENTER
            </h1>
            <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Deploy new combat environments</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="text-zinc-500 hover:text-white hover:bg-zinc-900"
              onClick={() => window.location.reload()}
            >
              Discard Draft
            </Button>
            <Button
              onClick={submit}
              disabled={loading || !name}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 px-6 shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4 fill-current" />}
              Publish Arena
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-zinc-100 italic tracking-tight">
                  <Settings2 className="h-4 w-4 text-emerald-500" />
                  Contest Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Arena Designation</Label>
                  <Input
                    id="name"
                    placeholder="E.g. NEON_NIGHT_HACK"
                    className="bg-black border-zinc-800 text-white focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc" className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Briefing</Label>
                  <Textarea
                    id="desc"
                    placeholder="Mission objectives..."
                    className="bg-black border-zinc-800 text-white focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50 min-h-30"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <Separator className="bg-zinc-900" />

                <div className="flex items-center justify-between p-3 bg-zinc-900/30 rounded-lg border border-zinc-800/50">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-emerald-500" />
                      Scheduling
                    </Label>
                    <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-tight">Deferred Start Protocol</p>
                  </div>
                  <Switch checked={scheduled} onCheckedChange={setScheduled} />
                </div>

                {scheduled && (
                  <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 duration-300">
                    <div className="grid gap-2">
                      <Label className="text-[10px] text-zinc-500 uppercase font-bold">Infiltration Date (Start)</Label>
                      <Input
                        type="datetime-local"
                        className="bg-black border-zinc-800 text-white"
                        value={startAt}
                        onChange={(e) => setStartAt(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] text-zinc-500 uppercase font-bold">Extraction Date (End)</Label>
                      <Input
                        type="datetime-local"
                        className="bg-black border-zinc-800 text-white"
                        value={endAt}
                        onChange={(e) => setEndAt(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Task Modules */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black tracking-tighter flex items-center gap-2 text-white italic">
                TASK_MODULES
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 ml-2">{subs.length}</Badge>
              </h3>
              <Button type="button" size="sm" onClick={addSub} className="bg-zinc-100 text-black hover:bg-white font-bold gap-1 rounded-md">
                <Plus className="h-4 w-4" /> Add Challenge
              </Button>
            </div>

            <div className="space-y-6">
              {subs.map((sc, idx) => (
                <Card key={idx} className="relative overflow-hidden bg-zinc-950 border-zinc-800 hover:border-emerald-500/30 transition-all duration-300">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-600" />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="border-zinc-800 text-zinc-500 font-mono text-[10px]">#MOD_0{idx + 1}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-600 hover:text-rose-500 hover:bg-rose-500/5 transition-all"
                        onClick={() => removeSub(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      className="text-xl font-black border-none px-0 focus-visible:ring-0 bg-transparent text-white placeholder:text-zinc-800 tracking-tight italic"
                      placeholder="CHALLENGE_TITLE"
                      value={sc.title}
                      onChange={(e) => updateSub(idx, { title: e.target.value })}
                    />
                  </CardHeader>
                  <CardContent className="space-y-6 pb-6">
                    <Textarea
                      placeholder="Task overview and success criteria..."
                      className="bg-black/50 border-zinc-800 text-zinc-300 placeholder:text-zinc-700 min-h-20"
                      value={sc.description}
                      onChange={(e) => updateSub(idx, { description: e.target.value })}
                    />
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                          <FileText className="h-3 w-3 text-emerald-500" /> Notion Asset ID
                        </Label>
                        <Input
                          placeholder="Doc ID..."
                          className="bg-black border-zinc-800 text-white font-mono text-xs"
                          value={sc.notionDocId}
                          onChange={(e) => updateSub(idx, { notionDocId: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                          <Trophy className="h-3 w-3 text-emerald-500" /> Bounty (Points)
                        </Label>
                        <Input
                          type="number"
                          className="bg-black border-zinc-800 text-emerald-500 font-black"
                          value={sc.points}
                          onChange={(e) => updateSub(idx, { points: Number(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {subs.length === 0 && (
                <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/50">
                  <p className="text-zinc-600 font-mono text-sm uppercase">Arena Empty: Deploy Tasks to Begin</p>
                  <Button variant="link" onClick={addSub} className="text-emerald-500 mt-2 font-bold uppercase text-xs tracking-widest hover:text-emerald-400">
                    Initialize First Module
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}