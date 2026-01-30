"use client"

import type React from "react"
import { useState } from "react"
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

type SubChallenge = {
  title: string
  points: number
  description: string
  notionDocId: string
}

export default function AdminPage() {
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [scheduled, setScheduled] = useState(false)
  const [startAt, setStartAt] = useState("")
  const [endAt, setEndAt] = useState("")

  const [subs, setSubs] = useState<SubChallenge[]>([
    {
      title: "Warm-up task",
      points: 100,
      description: "demo test",
      notionDocId: "123abc",
    },
  ])

  const addSub = () =>
    setSubs((s) => [
      ...s,
      { title: "", points: 100, description: "", notionDocId: "" },
    ])

  const removeSub = (idx: number) =>
    setSubs((s) => s.filter((_, i) => i !== idx))

  const updateSub = (idx: number, patch: Partial<SubChallenge>) =>
    setSubs((s) =>
      s.map((item, i) => (i === idx ? { ...item, ...patch } : item)),
    )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // 1️⃣ Create Contest
      const contestRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/contest/admin/contest`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: name,
            description,
            startTime:
              scheduled && startAt ? startAt : new Date().toISOString(),
          }),
        },
      )

      const contestJson = await contestRes.json()
      if (!contestJson.ok) throw new Error("Contest creation failed")

      const contestId = contestJson.contest.id

      // 2️⃣ Create Challenges + Map
      for (let i = 0; i < subs.length; i++) {
        const sc = subs[i]

        if (!sc.title || !sc.description || !sc.notionDocId) {
          throw new Error("Challenge fields cannot be empty")
        }

        const challengeRes = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/contest/admin/challenge`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: sc.title,
              description: sc.description,
              maxPoints: sc.points,
              notionDocId: sc.notionDocId,
            }),
          },
        )

        const challengeJson = await challengeRes.json()
        if (!challengeJson.ok)
          throw new Error("Challenge creation failed")

        await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/contest/admin/contest/${contestId}/challenge`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              challengeId: challengeJson.challenge.id,
              index: i,
            }),
          },
        )
      }

      toast({
        title: "Contest created 🎉",
        description: `${subs.length} challenges added successfully`,
      })

      // reset
      setName("")
      setDescription("")
      setSubs([
        {
          title: "Warm-up task",
          points: 100,
          description: "demo test",
          notionDocId: "123abc",
        },
      ])
      setScheduled(false)
      setStartAt("")
      setEndAt("")
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
      })
    }
  }

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">
          Create contests and challenges
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>New Contest</CardTitle>
          <CardDescription>
            Contest metadata and challenges
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="grid gap-6" onSubmit={submit}>
            <div className="grid gap-2">
              <Label>Contest Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="grid gap-2">
              <Label>Contest Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={scheduled} onCheckedChange={setScheduled} />
              <Label>Schedule for later</Label>
            </div>

            {scheduled && (
              <div className="grid sm:grid-cols-2 gap-4">
                <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
              </div>
            )}

            <div className="grid gap-4">
              <div className="flex justify-between">
                <h3 className="font-semibold">Challenges</h3>
                <Button type="button" onClick={addSub} variant="secondary">
                  Add Challenge
                </Button>
              </div>

              {subs.map((sc, idx) => (
                <div key={idx} className="border rounded-lg p-4 grid gap-3">
                  <Input
                    placeholder="Title"
                    value={sc.title}
                    onChange={(e) => updateSub(idx, { title: e.target.value })}
                    required
                  />
                  <Textarea
                    placeholder="Description"
                    value={sc.description}
                    onChange={(e) => updateSub(idx, { description: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Notion Doc ID"
                    value={sc.notionDocId}
                    onChange={(e) => updateSub(idx, { notionDocId: e.target.value })}
                    required
                  />
                  <Input
                    type="number"
                    min={0}
                    value={sc.points}
                    onChange={(e) =>
                      updateSub(idx, { points: Number(e.target.value) || 0 })
                    }
                  />
                  <Button type="button" variant="destructive" onClick={() => removeSub(idx)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button type="submit">Create Contest</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
