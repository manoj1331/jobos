"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, FileText, Download, Trash2, Star, File } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"

const DOC_TYPES = ["resume","cover_letter","portfolio","certificate","transcript","visa","other"]
const DOC_TYPE_LABELS: Record<string, string> = {
  resume: "Resume", cover_letter: "Cover Letter", portfolio: "Portfolio",
  certificate: "Certificate", transcript: "Transcript", visa: "Visa Document", other: "Other",
}
const DOC_ICONS: Record<string, string> = {
  resume: "📄", cover_letter: "✉️", portfolio: "🎨", certificate: "🏆",
  transcript: "📋", visa: "🌐", other: "📎",
}

async function fetchDocuments() {
  const res = await fetch("/api/documents")
  if (!res.ok) return { documents: [] }
  return res.json()
}

export default function DocumentsPage() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", type: "resume", fileUrl: "", version: "1", notes: "" })

  const { data, isLoading } = useQuery({ queryKey: ["documents"], queryFn: fetchDocuments })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, version: parseInt(form.version) }),
      })
      if (!res.ok) throw new Error()
      toast({ title: "Document added", variant: "success" })
      qc.invalidateQueries({ queryKey: ["documents"] })
      setFormOpen(false)
      setForm({ name: "", type: "resume", fileUrl: "", version: "1", notes: "" })
    } catch { toast({ title: "Error", variant: "destructive" }) }
    finally { setSaving(false) }
  }

  async function setDefault(id: string) {
    await fetch(`/api/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    })
    qc.invalidateQueries({ queryKey: ["documents"] })
    toast({ title: "Set as default", variant: "success" })
  }

  async function deleteDoc(id: string) {
    if (!confirm("Delete document?")) return
    await fetch(`/api/documents/${id}`, { method: "DELETE" })
    qc.invalidateQueries({ queryKey: ["documents"] })
    toast({ title: "Deleted", variant: "success" })
  }

  const documents = data?.documents ?? []
  const byType = DOC_TYPES.reduce((acc, t) => {
    acc[t] = documents.filter((d: any) => d.type === t)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-gray-400 text-sm">{documents.length} documents stored</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4" /> Add Document
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p>No documents yet. Add your resume to get started!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {DOC_TYPES.filter(t => byType[t]?.length > 0).map(type => (
            <div key={type}>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>{DOC_ICONS[type]}</span>
                {DOC_TYPE_LABELS[type]} ({byType[type].length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {byType[type].map((doc: any) => (
                  <div key={doc.id} className="bg-[#16161e] border border-[#2a2a3a] rounded-xl p-4 hover:border-[#3a3a4a] transition-all group">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#2a2a3a] flex items-center justify-center text-lg shrink-0">
                        {DOC_ICONS[doc.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate flex items-center gap-2">
                          {doc.name}
                          {doc.isDefault && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                        </div>
                        <div className="text-xs text-gray-400">v{doc.version} · {formatDate(doc.createdAt)}</div>
                        {doc.notes && <div className="text-xs text-gray-500 mt-1 truncate">{doc.notes}</div>}
                        <div className="text-xs text-gray-600 mt-1">Used in {doc.jobUsage?.length ?? 0} applications</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="icon-sm"><Download className="w-3.5 h-3.5" /></Button>
                        </a>
                      )}
                      {!doc.isDefault && (
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setDefault(doc.id)}>
                          <Star className="w-3 h-3 mr-1" /> Set default
                        </Button>
                      )}
                      <Button variant="ghost" size="icon-sm" className="text-red-400 ml-auto" onClick={() => deleteDoc(doc.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Document</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Document Name *</Label>
              <Input placeholder="Resume v3 - SWE" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map(t => <SelectItem key={t} value={t}>{DOC_TYPE_LABELS[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>File URL</Label>
              <Input placeholder="https://drive.google.com/..." value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Version</Label>
              <Input type="number" min="1" value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Add Document</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
