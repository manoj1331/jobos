"use client"

import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { X } from "lucide-react"

interface CompanyFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: Record<string, any>
}

export function CompanyForm({ open, onClose, onSuccess, initialData }: CompanyFormProps) {
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [techInput, setTechInput] = useState("")
  const [form, setForm] = useState({
    name: "", website: "", careersUrl: "", linkedin: "",
    industry: "", size: "", location: "", headquarters: "",
    glassdoorRating: "", hiringStatus: "unknown", remotePolicy: "unknown",
    visaSponsorship: false, isFavorite: false, priority: "medium",
    notes: "", techStack: [] as string[], status: "active",
  })

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name ?? "",
        website: initialData.website ?? "",
        careersUrl: initialData.careersUrl ?? "",
        linkedin: initialData.linkedin ?? "",
        industry: initialData.industry ?? "",
        size: initialData.size ?? "",
        location: initialData.location ?? "",
        headquarters: initialData.headquarters ?? "",
        glassdoorRating: initialData.glassdoorRating?.toString() ?? "",
        hiringStatus: initialData.hiringStatus ?? "unknown",
        remotePolicy: initialData.remotePolicy ?? "unknown",
        visaSponsorship: initialData.visaSponsorship ?? false,
        isFavorite: initialData.isFavorite ?? false,
        priority: initialData.priority ?? "medium",
        notes: initialData.notes ?? "",
        techStack: initialData.techStack ?? [],
        status: initialData.status ?? "active",
      })
    } else {
      setForm({ name: "", website: "", careersUrl: "", linkedin: "", industry: "", size: "", location: "", headquarters: "", glassdoorRating: "", hiringStatus: "unknown", remotePolicy: "unknown", visaSponsorship: false, isFavorite: false, priority: "medium", notes: "", techStack: [], status: "active" })
    }
  }, [initialData, open])

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const url = initialData ? `/api/companies/${initialData.id}` : "/api/companies"
      const method = initialData ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, glassdoorRating: form.glassdoorRating ? parseFloat(form.glassdoorRating) : undefined }),
      })
      if (!res.ok) throw new Error("Failed")
      toast({ title: initialData ? "Company updated" : "Company added", variant: "success" })
      qc.invalidateQueries({ queryKey: ["companies"] })
      onSuccess()
    } catch {
      toast({ title: "Error saving company", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  function addTech() {
    const t = techInput.trim()
    if (t && !form.techStack.includes(t)) setForm(f => ({ ...f, techStack: [...f.techStack, t] }))
    setTechInput("")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Company" : "Add Company"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label>Company Name *</Label>
              <Input placeholder="Acme Corp" value={form.name} onChange={e => set("name", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input placeholder="https://acme.com" value={form.website} onChange={e => set("website", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Careers URL</Label>
              <Input placeholder="https://acme.com/careers" value={form.careersUrl} onChange={e => set("careersUrl", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Input placeholder="Software" value={form.industry} onChange={e => set("industry", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Company Size</Label>
              <Select value={form.size} onValueChange={v => set("size", v)}>
                <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                <SelectContent>
                  {["1-10","11-50","51-200","201-1000","1001-5000","5000+"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input placeholder="San Francisco, CA" value={form.location} onChange={e => set("location", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Remote Policy</Label>
              <Select value={form.remotePolicy} onValueChange={v => set("remotePolicy", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Unknown</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">Onsite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Glassdoor Rating</Label>
              <Input type="number" min="1" max="5" step="0.1" placeholder="4.2" value={form.glassdoorRating} onChange={e => set("glassdoorRating", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4 col-span-2">
              <div className="flex items-center gap-2">
                <Switch checked={form.visaSponsorship} onCheckedChange={v => set("visaSponsorship", v)} />
                <Label>Visa Sponsorship</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isFavorite} onCheckedChange={v => set("isFavorite", v)} />
                <Label>Favorite</Label>
              </div>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Tech Stack</Label>
              <div className="flex gap-2">
                <Input placeholder="React, Python, Go..." value={techInput} onChange={e => setTechInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTech() } }} />
                <Button type="button" variant="secondary" onClick={addTech}>Add</Button>
              </div>
              {form.techStack.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.techStack.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#2a2a3a] text-gray-300 text-xs">
                      {t}
                      <button type="button" onClick={() => setForm(f => ({ ...f, techStack: f.techStack.filter(x => x !== t) }))}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Notes</Label>
              <Textarea placeholder="Notes about this company..." value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>{initialData ? "Update" : "Add Company"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
