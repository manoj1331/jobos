"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { User, Target, Download, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { data: session } = useSession()
  const qc = useQueryClient()
  const [goalForm, setGoalForm] = useState({ title: "", target: "", unit: "applications", period: "weekly" })

  const { data: goalsData } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => { const r = await fetch("/api/goals"); return r.json() },
  })

  async function addGoal(e: React.FormEvent) {
    e.preventDefault()
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...goalForm, target: parseInt(goalForm.target) }),
    })
    toast({ title: "Goal added", variant: "success" })
    qc.invalidateQueries({ queryKey: ["goals"] })
    setGoalForm({ title: "", target: "", unit: "applications", period: "weekly" })
  }

  async function exportData() {
    const [jobs, companies, recruiters] = await Promise.all([
      fetch("/api/jobs?limit=1000").then(r => r.json()),
      fetch("/api/companies").then(r => r.json()),
      fetch("/api/recruiters").then(r => r.json()),
    ])
    const blob = new Blob([JSON.stringify({ jobs: jobs.jobs, companies: companies.companies, recruiters: recruiters.recruiters }, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "jobos-export.json"; a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Data exported", variant: "success" })
  }

  const goals = goalsData?.goals ?? []

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-4 h-4 text-indigo-400" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={session?.user?.name ?? ""} readOnly className="opacity-60" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={session?.user?.email ?? ""} readOnly className="opacity-60" />
          </div>
          <p className="text-xs text-gray-500">Profile editing coming soon</p>
        </CardContent>
      </Card>

      {/* Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="w-4 h-4 text-emerald-400" />
            Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.map((g: any) => (
            <div key={g.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">{g.title}</span>
                <span className="text-xs text-gray-400">{g.current}/{g.target} {g.unit}</span>
              </div>
              <Progress value={Math.min((g.current / g.target) * 100, 100)} />
              <div className="text-xs text-gray-500">{g.period}</div>
            </div>
          ))}

          <Separator />

          <form onSubmit={addGoal} className="space-y-3">
            <p className="text-sm font-medium text-gray-300">Add Goal</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Goal Title</Label>
                <Input placeholder="Weekly Applications" value={goalForm.title} onChange={e => setGoalForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Target</Label>
                <Input type="number" min="1" placeholder="5" value={goalForm.target} onChange={e => setGoalForm(f => ({ ...f, target: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Input placeholder="applications" value={goalForm.unit} onChange={e => setGoalForm(f => ({ ...f, unit: e.target.value }))} />
              </div>
            </div>
            <Button type="submit" variant="secondary" size="sm">
              <Plus className="w-3.5 h-3.5" /> Add Goal
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="w-4 h-4 text-blue-400" />
            Data & Export
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-400">Export all your data as JSON. Includes jobs, companies, and recruiters.</p>
          <Button variant="secondary" onClick={exportData}>
            <Download className="w-4 h-4" /> Export Data (JSON)
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-900/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-red-400">
            <Trash2 className="w-4 h-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 mb-3">Once deleted, your account and all data cannot be recovered.</p>
          <Button variant="destructive" onClick={() => toast({ title: "Contact support to delete your account", variant: "destructive" })}>
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
