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
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

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

      toast({ title: "Success! ", description: "Contest has been published successfully." })
      // Reset form logic here...
    } catch (err: any) {
      toast({ title: "Error", description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-full space-y-8 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Contest</h1>
          <p className="text-muted-foreground">Setup your competition and link challenges from Notion.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>Discard</Button>
          <Button onClick={submit} disabled={loading || !name}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publish Contest
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: General Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings2 className="h-5 w-5 text-primary" />
                Contest Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="name">Contest Name</Label>
                <Input id="name" placeholder="E.g. Winter Hackathon 2024" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-4">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" placeholder="What is this contest about?" className="min-h-25" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Scheduling</Label>
                  <p className="text-xs text-muted-foreground">Set a specific start time</p>
                </div>
                <Switch checked={scheduled} onCheckedChange={setScheduled} />
              </div>

              {scheduled && (
                <div className="space-y-3 pt-2">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Start Date & Time</Label>
                    <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">End Date & Time</Label>
                    <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Challenges */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Challenges
              <Badge variant="secondary" className="ml-2">{subs.length}</Badge>
            </h3>
            <Button type="button" size="sm" onClick={addSub} className="gap-1">
              <Plus className="h-4 w-4" /> Add Task
            </Button>
          </div>

          <div className="space-y-4">
            {subs.map((sc, idx) => (
              <Card key={idx} className="relative overflow-hidden group border-l-4 border-l-primary/20 hover:border-l-primary transition-all">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="mb-2">Challenge #{idx + 1}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => removeSub(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    className="text-lg font-bold border-none px-0 focus-visible:ring-0 placeholder:opacity-50"
                    placeholder="Enter challenge title..."
                    value={sc.title}
                    onChange={(e) => updateSub(idx, { title: e.target.value })}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Short summary for the challenge card..."
                    className="resize-none"
                    value={sc.description}
                    onChange={(e) => updateSub(idx, { description: e.target.value })}
                  />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Notion Document ID
                      </Label>
                      <Input
                        placeholder="e.g. 123abc456..."
                        value={sc.notionDocId}
                        onChange={(e) => updateSub(idx, { notionDocId: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs flex items-center gap-1">
                        <Trophy className="h-3 w-3" /> Max Points
                      </Label>
                      <Input
                        type="number"
                        value={sc.points}
                        onChange={(e) => updateSub(idx, { points: Number(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {subs.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
                <p className="text-muted-foreground">No challenges added yet.</p>
                <Button variant="link" onClick={addSub}>Add your first challenge</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}