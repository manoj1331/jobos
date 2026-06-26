"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Search, RefreshCw, Bookmark, BookmarkCheck, ExternalLink, MapPin, Calendar, Briefcase, Building2, AlertCircle, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { timeAgo } from "@/lib/utils"

const SOURCE_LABEL: Record<string, string> = {
  naukri: "Naukri", linkedin: "LinkedIn", indeed: "Indeed",
  glassdoor: "Glassdoor", google: "Google Jobs",
  wellfound: "Wellfound", remoteok: "RemoteOK", remotive: "Remotive",
}

const STATUS_OPTIONS = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "rejected", label: "Rejected" },
]

const STATUS_COLORS: Record<string, string> = {
  saved: "bg-amber-600/20 text-amber-300 border-amber-600/30",
  applied: "bg-blue-600/20 text-blue-300 border-blue-600/30",
  interview: "bg-violet-600/20 text-violet-300 border-violet-600/30",
  rejected: "bg-red-600/20 text-red-300 border-red-600/30",
}

function JobCard({ job, onRefresh }: { job: any; onRefresh: () => void }) {
  const [saving, setSaving] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)

  const workType = job.isRemote ? "Remote" : job.isHybrid ? "Hybrid" : "Onsite"
  const appStatus = job.application?.status

  async function toggleSave() {
    setSaving(true)
    const res = await fetch(`/api/discover/${job.id}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save" }),
    })
    const d = await res.json()
    toast({ title: d.saved ? "Job saved" : "Removed from saved", variant: "success" })
    onRefresh()
    setSaving(false)
  }

  async function handleApply() {
    await fetch(`/api/discover/${job.id}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "apply" }),
    })
    window.open(job.applyUrl, "_blank", "noopener,noreferrer")
    toast({ title: "Opening job posting…", variant: "success" })
    onRefresh()
  }

  async function setStatus(status: string) {
    await fetch(`/api/discover/${job.id}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_status", status }),
    })
    setStatusOpen(false)
    toast({ title: `Status: ${status}`, variant: "success" })
    onRefresh()
  }

  return (
    <div className="bg-[#16161e] border border-[#2a2a3a] rounded-xl p-4 hover:border-[#3a3a4a] transition-colors">
      {/* Top row: company logo + name + title + save */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#2a2a3a] flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden">
          {job.companyLogo
            ? <img src={job.companyLogo} alt="" className="w-full h-full object-contain" onError={e => { (e.target as any).style.display = "none" }} />
            : job.company?.[0]?.toUpperCase()
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm">{job.title}</div>
          <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <Building2 className="w-3 h-3 shrink-0" />{job.company}
          </div>
        </div>
        <button onClick={toggleSave} disabled={saving} className="shrink-0 text-gray-600 hover:text-amber-400 transition-colors">
          {job.isSaved ? <BookmarkCheck className="w-4 h-4 text-amber-400" /> : <Bookmark className="w-4 h-4" />}
        </button>
      </div>

      {/* Details row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />{job.location}
        </span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
          workType === "Remote" ? "bg-emerald-600/20 text-emerald-300" :
          workType === "Hybrid" ? "bg-blue-600/20 text-blue-300" :
          "bg-gray-600/20 text-gray-400"
        }`}>
          {workType}
        </span>
        {(job.experienceMin != null || job.experienceMax != null) && (
          <span className="flex items-center gap-1">
            <Briefcase className="w-3 h-3" />
            {job.experienceMin != null && job.experienceMax != null
              ? `${job.experienceMin}–${job.experienceMax} yrs`
              : job.experienceMin != null ? `${job.experienceMin}+ yrs`
              : `Up to ${job.experienceMax} yrs`}
          </span>
        )}
        {job.postedAt && (
          <span className="flex items-center gap-1 ml-auto">
            <Calendar className="w-3 h-3" />{timeAgo(job.postedAt)}
          </span>
        )}
      </div>

      {/* Summary */}
      {job.description && (
        <p className="mt-2 text-xs text-gray-500 line-clamp-2">
          {job.description.replace(/<[^>]+>/g, "").trim()}
        </p>
      )}

      {/* Footer: source + status + apply */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#2a2a3a]">
        <span className="text-[10px] text-gray-600 bg-[#1e1e2a] px-2 py-0.5 rounded-full border border-[#2a2a3a]">
          {SOURCE_LABEL[job.source] ?? job.source}
        </span>

        {/* Status badge + picker */}
        <div className="relative">
          <button
            onClick={() => setStatusOpen(!statusOpen)}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
              appStatus ? STATUS_COLORS[appStatus] : "text-gray-600 border-[#2a2a3a] hover:border-[#3a3a4a]"
            }`}
          >
            {appStatus ? appStatus.charAt(0).toUpperCase() + appStatus.slice(1) : "Track ▾"}
          </button>
          {statusOpen && (
            <div className="absolute left-0 bottom-7 bg-[#1e1e2a] border border-[#2a2a3a] rounded-xl overflow-hidden z-10 shadow-xl w-32">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`w-full text-left text-xs px-3 py-2 hover:bg-[#2a2a3a] transition-colors ${appStatus === opt.value ? "text-indigo-400" : "text-gray-300"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button size="sm" className="ml-auto h-7 text-xs px-3 gap-1.5" onClick={handleApply}>
          <ExternalLink className="w-3 h-3" />Apply
        </Button>
      </div>
    </div>
  )
}

export default function DiscoverPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [location, setLocation] = useState("")
  const [workType, setWorkType] = useState("")
  const [page, setPage] = useState(1)
  const [fetching, setFetching] = useState(false)

  const params = new URLSearchParams({ page: String(page), limit: "20" })
  if (search) params.set("search", search)
  if (location) params.set("search", location) // location search uses same field
  if (workType === "remote") params.set("remote", "true")
  if (workType === "hybrid") params.set("remote", "hybrid")

  const { data, isLoading } = useQuery({
    queryKey: ["discover", search, location, workType, page],
    queryFn: () => fetch(`/api/discover?${params}`).then(r => r.json()),
  })

  const { data: stats } = useQuery({
    queryKey: ["discover-stats"],
    queryFn: () => fetch("/api/discover/stats").then(r => r.json()),
    refetchInterval: 60000,
  })

  async function refresh() {
    setFetching(true)
    toast({ title: "Fetching latest jobs from Naukri, LinkedIn, Indeed…" })
    try {
      const res = await fetch("/api/discover/refresh", { method: "POST" })
      const d = await res.json()
      if (d.success) {
        toast({ title: `Done — ${d.inserted} new jobs found`, variant: "success" })
        qc.invalidateQueries({ queryKey: ["discover"] })
        qc.invalidateQueries({ queryKey: ["discover-stats"] })
      }
    } catch {
      toast({ title: "Fetch failed", variant: "destructive" })
    }
    setFetching(false)
  }

  const jobs = data?.jobs ?? []
  const total = data?.total ?? 0

  return (
    <div className="max-w-4xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Find Jobs</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            {stats?.total ?? 0} jobs · DevOps, Cloud, Platform, Cloud Support · India · 3–4 yrs
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={refresh} loading={fetching} className="gap-2">
          <RefreshCw className={`w-3.5 h-3.5 ${fetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Jobs", value: stats?.total ?? 0 },
          { label: "Saved", value: stats?.saved ?? 0 },
          { label: "Applied", value: stats?.applied ?? 0 },
          { label: "Interviews", value: stats?.interviews ?? 0 },
        ].map(s => (
          <div key={s.label} className="bg-[#16161e] border border-[#2a2a3a] rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            placeholder="Search by title, company, or city…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <Select value={workType} onValueChange={v => { setWorkType(v); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Work type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            <SelectItem value="remote">Remote</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
            <SelectItem value="onsite">Onsite</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Job list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-gray-700" />
          <p className="text-gray-500">
            {stats?.total === 0
              ? "No jobs yet — click Refresh to fetch live listings"
              : "No jobs match your search"}
          </p>
          {stats?.total === 0 && (
            <Button onClick={refresh} loading={fetching} className="mt-4">Fetch Jobs Now</Button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {jobs.map((job: any) => (
              <JobCard key={job.id} job={job} onRefresh={() => qc.invalidateQueries({ queryKey: ["discover"] })} />
            ))}
          </div>
          {total > 20 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-xs text-gray-500">{page} / {Math.ceil(total / 20)} · {total} jobs</span>
              <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
