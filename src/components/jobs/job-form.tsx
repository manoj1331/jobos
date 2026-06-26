"use client"

import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { X } from "lucide-react"

interface JobFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: Record<string, any>
}

export function JobForm({ open, onClose, onSuccess, initialData }: JobFormProps) {
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: "",
    companyName: "",
    location: "",
    salaryMin: "",
    salaryMax: "",
    employmentType: "full-time",
    remote: "onsite",
    jobUrl: "",
    priority: "medium",
    status: "saved",
    notes: "",
    requiredSkills: [] as string[],
    matchScore: "",
    deadline: "",
  })
  const [skillInput, setSkillInput] = useState("")

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title ?? "",
        companyName: initialData.company?.name ?? "",
        location: initialData.location ?? "",
        salaryMin: initialData.salaryMin?.toString() ?? "",
        salaryMax: initialData.salaryMax?.toString() ?? "",
        employmentType: initialData.employmentType ?? "full-time",
        remote: initialData.remote ?? "onsite",
        jobUrl: initialData.jobUrl ?? "",
        priority: initialData.priority ?? "medium",
        status: initialData.status ?? "saved",
        notes: initialData.notes ?? "",
        requiredSkills: initialData.requiredSkills ?? [],
        matchScore: initialData.matchScore?.toString() ?? "",
        deadline: initialData.deadline ? new Date(initialData.deadline).toISOString().split("T")[0] : "",
      })
    }
  }, [initialData])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const url = initialData ? `/api/jobs/${initialData.id}` : "/api/jobs"
      const method = initialData ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          salaryMin: form.salaryMin ? parseInt(form.salaryMin) : undefined,
          salaryMax: form.salaryMax ? parseInt(form.salaryMax) : undefined,
          matchScore: form.matchScore ? parseInt(form.matchScore) : undefined,
          boardColumn: form.status,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      toast({ title: initialData ? "Job updated" : "Job added", variant: "success" })
      qc.invalidateQueries({ queryKey: ["jobs"] })
      qc.invalidateQueries({ queryKey: ["pipeline"] })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
      onSuccess()
      onClose()
    } catch {
      toast({ title: "Error saving job", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  function addSkill() {
    const s = skillInput.trim()
    if (s && !form.requiredSkills.includes(s)) {
      setForm(f => ({ ...f, requiredSkills: [...f.requiredSkills, s] }))
    }
    setSkillInput("")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Job" : "Add New Job"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label>Job Title *</Label>
              <Input placeholder="Software Engineer" value={form.title} onChange={e => set("title", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Company Name</Label>
              <Input placeholder="Acme Corp" value={form.companyName} onChange={e => set("companyName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input placeholder="San Francisco, CA" value={form.location} onChange={e => set("location", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Min Salary ($)</Label>
              <Input type="number" placeholder="100000" value={form.salaryMin} onChange={e => set("salaryMin", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Max Salary ($)</Label>
              <Input type="number" placeholder="150000" value={form.salaryMax} onChange={e => set("salaryMax", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Employment Type</Label>
              <Select value={form.employmentType} onValueChange={v => set("employmentType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Work Type</Label>
              <Select value={form.remote} onValueChange={v => set("remote", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="onsite">Onsite</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="saved">Saved</SelectItem>
                  <SelectItem value="researching">Researching</SelectItem>
                  <SelectItem value="ready">Ready to Apply</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Match Score (0-100)</Label>
              <Input type="number" min="0" max="100" placeholder="85" value={form.matchScore} onChange={e => set("matchScore", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Deadline</Label>
              <Input type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Job URL</Label>
              <Input placeholder="https://..." value={form.jobUrl} onChange={e => set("jobUrl", e.target.value)} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Required Skills</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add skill and press Enter"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill() } }}
                />
                <Button type="button" variant="secondary" onClick={addSkill}>Add</Button>
              </div>
              {form.requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.requiredSkills.map(s => (
                    <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-600/20 text-indigo-300 text-xs border border-indigo-600/30">
                      {s}
                      <button type="button" onClick={() => setForm(f => ({ ...f, requiredSkills: f.requiredSkills.filter(x => x !== s) }))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Notes</Label>
              <Textarea placeholder="Any notes about this job..." value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>{initialData ? "Update" : "Add Job"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
