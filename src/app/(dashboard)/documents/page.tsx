"use client"

import { useState, useRef, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Upload, FileText, File, Trash2, Star, Download,
  Edit2, Check, X, Plus, ExternalLink, Paperclip,
  Cloud, FolderOpen, Eye, RefreshCw, FolderInput
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"

const DOC_TYPES = ["resume", "cover_letter", "certificate", "transcript", "visa", "other"]
const DOC_LABELS: Record<string, string> = {
  resume: "Resume", cover_letter: "Cover Letter", certificate: "Certificate",
  transcript: "Transcript", visa: "Visa", other: "Other",
}
const DOC_ICONS: Record<string, string> = {
  resume: "📄", cover_letter: "✉️", certificate: "🏆",
  transcript: "📋", visa: "🌐", other: "📎",
}
const ALLOWED_EXTS = [".pdf", ".doc", ".docx", ".txt"]
const MAX_MB = 10

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function DocCard({ doc, onRefresh }: { doc: any; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(doc.name)
  const [saving, setSaving] = useState(false)
  const qc = useQueryClient()

  async function saveName() {
    setSaving(true)
    await fetch(`/api/documents/${doc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    setEditing(false)
    setSaving(false)
    onRefresh()
    toast({ title: "Document renamed", variant: "success" })
  }

  async function setDefault() {
    await fetch(`/api/documents/${doc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    })
    onRefresh()
    toast({ title: "Set as default", variant: "success" })
  }

  async function deleteDoc() {
    if (!confirm(`Delete "${doc.name}"?`)) return
    await fetch(`/api/documents/${doc.id}`, { method: "DELETE" })
    onRefresh()
    toast({ title: "Document deleted", variant: "success" })
  }

  const isLocal = doc.fileUrl?.startsWith("/api/documents/serve/")
  const previewUrl = isLocal ? `${doc.fileUrl}?preview=1` : doc.fileUrl
  const isPdf = doc.mimeType === "application/pdf" || doc.fileUrl?.endsWith(".pdf")

  return (
    <div className="bg-[#16161e] border border-[#2a2a3a] rounded-xl p-4 hover:border-[#3a3a4a] transition-all group space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#2a2a3a] flex items-center justify-center text-xl shrink-0">
          {DOC_ICONS[doc.type] ?? "📎"}
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-1">
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-7 text-sm"
                onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditing(false) }}
                autoFocus
              />
              <Button size="icon-sm" onClick={saveName} loading={saving}><Check className="w-3.5 h-3.5" /></Button>
              <Button size="icon-sm" variant="ghost" onClick={() => setEditing(false)}><X className="w-3.5 h-3.5" /></Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-white text-sm truncate">{doc.name}</span>
              {doc.isDefault && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
            </div>
          )}
          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
            <Badge variant="secondary" className="text-[10px] py-0">{DOC_LABELS[doc.type] ?? doc.type}</Badge>
            {doc.fileSize && <span>{formatSize(doc.fileSize)}</span>}
            <span>v{doc.version}</span>
            {doc.notes && <span className="truncate text-gray-600">{doc.notes}</span>}
          </div>
          <div className="text-xs text-gray-600 mt-0.5">{formatDate(doc.createdAt)}</div>
        </div>
      </div>

      {/* Used in applications */}
      {doc.jobUsage?.length > 0 && (
        <div className="text-xs text-gray-500 flex items-center gap-1.5">
          <Paperclip className="w-3 h-3" />
          Used in {doc.jobUsage.length} application{doc.jobUsage.length > 1 ? "s" : ""}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-[#2a2a3a] opacity-0 group-hover:opacity-100 transition-opacity">
        {doc.fileUrl && (
          <>
            {isPdf && (
              <a href={previewUrl} target="_blank" rel="noreferrer">
                <Button variant="ghost" size="icon-sm" title="Preview"><Eye className="w-3.5 h-3.5" /></Button>
              </a>
            )}
            <a href={doc.fileUrl} target="_blank" rel="noreferrer" download>
              <Button variant="ghost" size="icon-sm" title="Download"><Download className="w-3.5 h-3.5" /></Button>
            </a>
          </>
        )}
        <Button variant="ghost" size="icon-sm" title="Rename" onClick={() => setEditing(true)}>
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
        {!doc.isDefault && (
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={setDefault}>
            <Star className="w-3 h-3 mr-1" />Default
          </Button>
        )}
        <Button variant="ghost" size="icon-sm" className="text-red-400 hover:text-red-300 ml-auto" onClick={deleteDoc}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

function DropZone({ category, onUpload }: { category: string; onUpload: () => void }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = useCallback(async (files: File[]) => {
    const valid = files.filter(f => {
      const ext = "." + f.name.split(".").pop()?.toLowerCase()
      if (!ALLOWED_EXTS.includes(ext)) {
        toast({ title: `${f.name}: unsupported type (use PDF, DOC, DOCX, TXT)`, variant: "destructive" })
        return false
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        toast({ title: `${f.name}: exceeds ${MAX_MB} MB limit`, variant: "destructive" })
        return false
      }
      return true
    })

    if (!valid.length) return
    setUploading(true)
    setProgress(valid.map(f => f.name))

    const form = new FormData()
    valid.forEach(f => form.append("files", f))
    form.append("category", category)

    try {
      const res = await fetch("/api/documents/upload", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: `${data.documents.length} file${data.documents.length > 1 ? "s" : ""} uploaded`, variant: "success" })
      onUpload()
    } catch (e: any) {
      toast({ title: e.message || "Upload failed", variant: "destructive" })
    } finally {
      setUploading(false)
      setProgress([])
    }
  }, [category, onUpload])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    upload(Array.from(e.dataTransfer.files))
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
        dragging
          ? "border-indigo-500 bg-indigo-600/10"
          : "border-[#2a2a3a] hover:border-[#3a3a4a] hover:bg-[#1e1e2a]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={e => upload(Array.from(e.target.files ?? []))}
      />
      {uploading ? (
        <div className="space-y-2">
          <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Uploading {progress.length} file{progress.length > 1 ? "s" : ""}…</p>
          {progress.map(n => (
            <p key={n} className="text-xs text-gray-600 truncate">{n}</p>
          ))}
        </div>
      ) : (
        <>
          <Upload className="w-6 h-6 text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            <span className="text-indigo-400 font-medium">Click to browse</span> or drag & drop
          </p>
          <p className="text-xs text-gray-600 mt-1">PDF, DOC, DOCX, TXT — up to {MAX_MB} MB each · Multiple files supported</p>
        </>
      )}
    </div>
  )
}

function GoogleDriveImport({ category, onImport }: { category: string; onImport: () => void }) {
  const [url, setUrl] = useState("")
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleImport() {
    if (!url.trim() || !name.trim()) return
    setSaving(true)
    try {
      // Convert Google Drive share link to direct download link
      let fileUrl = url
      const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
      if (driveMatch) {
        fileUrl = `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`
      }

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "gdrive", name, category, fileUrl, mimeType: "application/pdf" }),
      })
      if (!res.ok) throw new Error("Import failed")
      toast({ title: "Google Drive file imported", variant: "success" })
      setUrl(""); setName("")
      onImport()
    } catch {
      toast({ title: "Import failed", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-[#16161e] border border-[#2a2a3a] rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-blue-600/20 flex items-center justify-center">
          <span className="text-xs font-bold text-blue-400">G</span>
        </div>
        <span className="text-sm font-medium text-white">Import from Google Drive</span>
      </div>
      <div className="space-y-2">
        <Input placeholder="Document name" value={name} onChange={e => setName(e.target.value)} />
        <Input placeholder="Google Drive share link (drive.google.com/file/d/...)" value={url} onChange={e => setUrl(e.target.value)} />
        <Button onClick={handleImport} loading={saving} disabled={!url || !name} variant="secondary" size="sm" className="w-full">
          <FolderInput className="w-3.5 h-3.5 mr-2" />Import from Drive
        </Button>
      </div>
      <p className="text-xs text-gray-600">Share the file with "Anyone with the link" → "Viewer" in Google Drive first</p>
    </div>
  )
}

function OneDriveImport({ category, onImport }: { category: string; onImport: () => void }) {
  const [url, setUrl] = useState("")
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleImport() {
    if (!url.trim() || !name.trim()) return
    setSaving(true)
    try {
      // Convert OneDrive share link to direct download link
      let fileUrl = url
      if (url.includes("1drv.ms") || url.includes("onedrive.live.com")) {
        // Encode the OneDrive share link for direct download
        const encoded = btoa(url).replace(/=$/, "").replace(/\+/g, "-").replace(/\//g, "_")
        fileUrl = `https://api.onedrive.com/v1.0/shares/u!${encoded}/root/content`
      }

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "onedrive", name, category, fileUrl, mimeType: "application/pdf" }),
      })
      if (!res.ok) throw new Error("Import failed")
      toast({ title: "OneDrive file imported", variant: "success" })
      setUrl(""); setName("")
      onImport()
    } catch {
      toast({ title: "Import failed", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-[#16161e] border border-[#2a2a3a] rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-sky-600/20 flex items-center justify-center">
          <Cloud className="w-3.5 h-3.5 text-sky-400" />
        </div>
        <span className="text-sm font-medium text-white">Import from OneDrive</span>
      </div>
      <div className="space-y-2">
        <Input placeholder="Document name" value={name} onChange={e => setName(e.target.value)} />
        <Input placeholder="OneDrive share link (1drv.ms/... or onedrive.live.com/...)" value={url} onChange={e => setUrl(e.target.value)} />
        <Button onClick={handleImport} loading={saving} disabled={!url || !name} variant="secondary" size="sm" className="w-full">
          <FolderInput className="w-3.5 h-3.5 mr-2" />Import from OneDrive
        </Button>
      </div>
      <p className="text-xs text-gray-600">Share the file with "Anyone with the link" in OneDrive first</p>
    </div>
  )
}

export default function DocumentsPage() {
  const [activeType, setActiveType] = useState("all")
  const [uploadCategory, setUploadCategory] = useState("resume")
  const [showUploadPanel, setShowUploadPanel] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["documents", activeType],
    queryFn: async () => {
      const q = activeType !== "all" ? `?type=${activeType}` : ""
      const res = await fetch(`/api/documents${q}`)
      return res.json()
    },
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ["documents"] })
  const documents: any[] = data?.documents ?? []

  const byType: Record<string, any[]> = {}
  for (const t of DOC_TYPES) byType[t] = []
  for (const doc of documents) {
    if (byType[doc.type]) byType[doc.type].push(doc)
    else byType["other"].push(doc)
  }

  const types = activeType === "all" ? DOC_TYPES.filter(t => byType[t].length > 0) : [activeType]

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-gray-400 text-sm">{documents.length} documents · Upload, preview, and organize your career files</p>
        </div>
        <Button onClick={() => setShowUploadPanel(!showUploadPanel)}>
          <Plus className="w-4 h-4" />Add Documents
        </Button>
      </div>

      {/* Upload panel */}
      {showUploadPanel && (
        <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Add Documents</h3>
            <Button variant="ghost" size="icon-sm" onClick={() => setShowUploadPanel(false)}><X className="w-4 h-4" /></Button>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={uploadCategory} onValueChange={setUploadCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map(t => <SelectItem key={t} value={t}>{DOC_LABELS[t]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Drag & Drop upload */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-400 uppercase tracking-wider">Upload from Computer</Label>
              <DropZone category={uploadCategory} onUpload={() => { refresh(); setShowUploadPanel(false) }} />
            </div>
            {/* Google Drive */}
            <GoogleDriveImport category={uploadCategory} onImport={() => { refresh(); setShowUploadPanel(false) }} />
            {/* OneDrive */}
            <OneDriveImport category={uploadCategory} onImport={() => { refresh(); setShowUploadPanel(false) }} />
          </div>
        </div>
      )}

      {/* Type tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveType("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            activeType === "all"
              ? "bg-indigo-600/20 text-indigo-300 border-indigo-600/30"
              : "text-gray-400 border-[#2a2a3a] hover:border-[#3a3a4a] hover:text-white"
          }`}
        >
          All ({documents.length})
        </button>
        {DOC_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 ${
              activeType === t
                ? "bg-indigo-600/20 text-indigo-300 border-indigo-600/30"
                : "text-gray-400 border-[#2a2a3a] hover:border-[#3a3a4a] hover:text-white"
            }`}
          >
            <span>{DOC_ICONS[t]}</span>{DOC_LABELS[t]} ({byType[t].length})
          </button>
        ))}
      </div>

      {/* Documents */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <FileText className="w-12 h-12 mx-auto text-gray-700" />
          <p className="text-gray-500 font-medium">No documents yet</p>
          <p className="text-gray-600 text-sm">Upload your resume, cover letters, and certificates</p>
          <Button onClick={() => setShowUploadPanel(true)} className="mt-2">
            <Upload className="w-4 h-4 mr-2" />Upload First Document
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {types.map(type => {
            const docs = byType[type]
            if (!docs.length) return null
            return (
              <div key={type}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>{DOC_ICONS[type]}</span>
                  {DOC_LABELS[type]} <span className="text-gray-600 font-normal">({docs.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {docs.map((doc: any) => (
                    <DocCard key={doc.id} doc={doc} onRefresh={refresh} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
