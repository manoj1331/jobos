"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { data: session } = useSession()

  async function exportData() {
    const res = await fetch("/api/discover?limit=1000")
    const d = await res.json()
    const blob = new Blob([JSON.stringify(d.jobs, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "jobos-export.json"; a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Exported", variant: "success" })
  }

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-bold text-white">Settings</h1>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Name</Label>
            <Input value={session?.user?.name ?? ""} readOnly className="opacity-60 h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Email</Label>
            <Input value={session?.user?.email ?? ""} readOnly className="opacity-60 h-8 text-sm" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Data</CardTitle></CardHeader>
        <CardContent>
          <Button variant="secondary" size="sm" onClick={exportData}>Export jobs as JSON</Button>
        </CardContent>
      </Card>
    </div>
  )
}
