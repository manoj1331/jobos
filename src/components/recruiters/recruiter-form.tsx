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

interface RecruiterFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: Record<string, any>
}

export function RecruiterForm({ open, onClose, onSuccess, initialData }: RecruiterFormProps) {
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "", email: "", phone: "", linkedin: "", location: "",
    title: "", lastContact: "", nextFollowUp: "",
    relationshipStatus: "new", notes: "",
  })

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name ?? "",
        email: initialData.email ?? "",
        phone: initialData.phone ?? "",
        linkedin: initialData.linkedin ?? "",
        location: initialData.location ?? "",
        title: initialData.title ?? "",
        lastContact: initialData.lastContact ? new Date(initialData.lastContact).toISOString().split("T")[0] : "",
        nextFollowUp: initialData.nextFollowUp ? new Date(initialData.nextFollowUp).toISOString().split("T")[0] : "",
        relationshipStatus: initialData.relationshipStatus ?? "new",
        notes: initialData.notes ?? "",
      })
    } else {
      setForm({ name: "", email: "", phone: "", linkedin: "", location: "", title: "", lastContact: "", nextFollowUp: "", relationshipStatus: "new", notes: "" })
    }
  }, [initialData, open])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const url = initialData ? `/api/recruiters/${initialData.id}` : "/api/recruiters"
      const method = initialData ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed")
      toast({ title: initialData ? "Recruiter updated" : "Recruiter added", variant: "success" })
      qc.invalidateQueries({ queryKey: ["recruiters"] })
      onSuccess()
    } catch {
      toast({ title: "Error saving recruiter", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Recruiter" : "Add Recruiter"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label>Full Name *</Label>
              <Input placeholder="Jane Recruiter" value={form.name} onChange={e => set("name", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="jane@company.com" value={form.email} onChange={e => set("email", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input placeholder="+1 555-0100" value={form.phone} onChange={e => set("phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>LinkedIn</Label>
              <Input placeholder="linkedin.com/in/..." value={form.linkedin} onChange={e => set("linkedin", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input placeholder="Technical Recruiter" value={form.title} onChange={e => set("title", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Relationship Status</Label>
              <Select value={form.relationshipStatus} onValueChange={v => set("relationshipStatus", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                  <SelectItem value="connected">Connected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Last Contact</Label>
              <Input type="date" value={form.lastContact} onChange={e => set("lastContact", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Next Follow-up</Label>
              <Input type="date" value={form.nextFollowUp} onChange={e => set("nextFollowUp", e.target.value)} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Notes</Label>
              <Textarea placeholder="Notes about this recruiter..." value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>{initialData ? "Update" : "Add Recruiter"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
