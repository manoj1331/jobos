"use client"

import { useState, useCallback } from "react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, RefreshCw, Bookmark, BookmarkCheck, ExternalLink,
  MapPin, Clock, Building2, Zap, Filter, ChevronDown,
  CheckCircle, Calendar, XCircle, Trophy, Briefcase,
  Globe, AlertCircle, Tag, Wifi
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { formatDate, timeAgo } from "@/lib/utils"

const SOURCE_LABELS: Record<string, string> = {
  remoteok: "RemoteOK",
  remotive: "Remotive",
  arbeitnow: "Arbeitnow",
  jobicy: "Jobicy",
  weworkremotely: "We Work Remotely",
  ycombinator: "YC Jobs",
  linkedin: "LinkedIn",
  indeed: "Indeed",
  glassdoor: "Glassdoor",
  jsearch: "JSearch",
}

const SOURCE_COLORS: Record<string, string> = {
  remoteok: "bg-emerald-600/20 text-emerald-300 border-emerald-600/30",
  remotive: "bg-blue-600/20 text-blue-300 border-blue-600/30",
  arbeitnow: "bg-purple-600/20 text-purple-300 border-purple-600/30",
  jobicy: "bg-amber-600/20 text-amber-300 border-amber-600/30",
  weworkremotely: "bg-rose-600/20 text-rose-300 border-rose-600/30",
  ycombinator: "bg-orange-600/20 text-orange-300 border-orange-600/30",
  linkedin: "bg-sky-600/20 text-sky-300 border-sky-600/30",
  indeed: "bg-indigo-600/20 text-indigo-300 border-indigo-600/30",
}

const APP_STATUS_LABELS: Record<string, string> = {
  applied: "Applied", interview: "Interview", offer: "Offer",
  rejected: "Rejected", ghosted: "Ghosted", withdrawn: "Withdrawn",
}
const APP_STATUS_COLORS: Record<string, string> = {
  applied: "bg-blue-600/20 text-blue-300 border-blue-600/30",
  interview: "bg-violet-600/20 text-violet-300 border-violet-600/30",
  offer: "bg-emerald-600/20 text-emerald-300 border-emerald-600/30",
  rejected: "bg-red-600/20 text-red-300 border-red-600/30",
  ghosted: "bg-gray-600/20 text-gray-400 border-gray-600/30",
}

function JobCard({ job, onRefresh }: { job: any; onRefresh: () => void }) {
  const [saving, setSaving] = useState(false)
  const [applying, setApplying] = useState(false)
  const [showStatusPicker, setShowStatusPicker] = useState(false)

  async function toggleSave(e: React.MouseEvent) {
    e.stopPropagation()
    setSaving(true)
    try {
      const res = await fetch(`/api/discover/${job.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save" }),
      })
      const data = await res.json()
      toast({ title: data.saved ? "Job saved" : "Removed from saved", variant: "success" })
      onRefresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleApply() {
    setApplying(true)
    try {
      const res = await fetch(`/api/discover/${job.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply" }),
      })
      const data = await res.json()
      if (data.redirectUrl) {
        window.open(data.redirectUrl, "_blank", "noopener,noreferrer")
        toast({ title: "Opening job posting…", description: "Application status updated to Applied", variant: "success" })
        onRefresh()
      }
    } finally {
      setApplying(false)
    }
  }

  async function updateStatus(status: string) {
    await fetch(`/api/discover/${job.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_status", status }),
    })
    setShowStatusPicker(false)
    toast({ title: `Status updated to ${APP_STATUS_LABELS[status]}`, variant: "success" })
    onRefresh()
  }

  const srcColor = SOURCE_COLORS[job.source] ?? "bg-gray-600/20 text-gray-300 border-gray-600/30"
  const appStatus = job.application?.status

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#16161e] border border-[#2a2a3a] rounded-xl p-5 hover:border-[#3a3a4a] transition-all group relative"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Logo */}
        <div className="w-11 h-11 rounded-xl bg-[#2a2a3a] flex items-center justify-center shrink-0 overflow-hidden">
          {job.companyLogo ? (
            <img src={job.companyLogo} alt={job.company} className="w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
          ) : (
            <span className="text-lg font-bold text-gray-300">{job.company?.[0]?.toUpperCase()}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm leading-tight">{job.title}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-sm text-gray-400">{job.company}</span>
            {job.companyType === "startup" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-600/30">Startup</span>
            )}
          </div>
        </div>

        {/* Save button */}
        <button onClick={toggleSave} disabled={saving} className="text-gray-600 hover:text-amber-400 transition-colors shrink-0">
          {job.isSaved
            ? <BookmarkCheck className="w-4 h-4 text-amber-400" />
            : <Bookmark className="w-4 h-4" />
          }
        </button>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-gray-400">
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />{job.location}
          </span>
        )}
        {job.isRemote && (
          <span className="flex items-center gap-1 text-emerald-400">
            <Wifi className="w-3 h-3" />Remote
          </span>
        )}
        {job.isHybrid && (
          <span className="flex items-center gap-1 text-blue-400">
            <Globe className="w-3 h-3" />Hybrid
          </span>
        )}
        {job.jobType && (
          <span className="flex items-center gap-1">
            <Briefcase className="w-3 h-3" />{job.jobType}
          </span>
        )}
        {job.postedAt && (
          <span className="flex items-center gap-1 ml-auto">
            <Clock className="w-3 h-3" />{timeAgo(job.postedAt)}
          </span>
        )}
      </div>

      {/* Salary */}
      {(job.salaryMin || job.salaryMax) && (
        <div className="mt-2 text-xs font-medium text-emerald-400">
          {job.salaryMin && job.salaryMax
            ? `${job.salaryCurrency ?? "$"}${(job.salaryMin/1000).toFixed(0)}k–${(job.salaryMax/1000).toFixed(0)}k`
            : job.salaryMin ? `From ${job.salaryCurrency ?? "$"}${(job.salaryMin/1000).toFixed(0)}k`
            : `Up to ${job.salaryCurrency ?? "$"}${(job.salaryMax!/1000).toFixed(0)}k`
          }
        </div>
      )}

      {/* Skills */}
      {job.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {job.skills.slice(0, 6).map((s: string) => (
            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#2a2a3a] text-gray-400 border border-[#3a3a4a]">
              {s}
            </span>
          ))}
          {job.skills.length > 6 && (
            <span className="text-[10px] text-gray-600">+{job.skills.length - 6}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#2a2a3a]">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${srcColor}`}>
          {SOURCE_LABELS[job.source] ?? job.source}
        </span>

        {appStatus && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${APP_STATUS_COLORS[appStatus] ?? "bg-gray-600/20 text-gray-300"}`}>
            {APP_STATUS_LABELS[appStatus] ?? appStatus}
          </span>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Status picker */}
          {job.application && (
            <div className="relative">
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => setShowStatusPicker(!showStatusPicker)}>
                Update <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
              {showStatusPicker && (
                <div className="absolute right-0 bottom-8 bg-[#1e1e2a] border border-[#2a2a3a] rounded-xl p-1 z-10 w-40 shadow-xl">
                  {Object.entries(APP_STATUS_LABELS).map(([val, label]) => (
                    <button key={val} onClick={() => updateStatus(val)}
                      className={`w-full text-left text-xs px-3 py-1.5 rounded-lg hover:bg-[#2a2a3a] ${appStatus === val ? "text-indigo-400" : "text-gray-300"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Apply button */}
          <Button
            size="sm"
            className="h-7 text-xs px-3 gap-1.5"
            onClick={handleApply}
            loading={applying}
            variant={job.application ? "secondary" : "default"}
          >
            <ExternalLink className="w-3 h-3" />
            {job.application ? "View Posting" : "Apply Now"}
          </Button>
        </div>
      </div>

      {/* Description preview on hover */}
      {job.description && (
        <div className="hidden group-hover:block mt-3 text-xs text-gray-500 line-clamp-3 border-t border-[#2a2a3a] pt-3">
          {job.description.replace(/<[^>]+>/g, "").trim().slice(0, 300)}...
        </div>
      )}
    </motion.div>
  )
}

export default function DiscoverPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [source, setSource] = useState("")
  const [remote, setRemote] = useState("")
  const [tab, setTab] = useState("all")
  const [page, setPage] = useState(1)
  const [fetching, setFetching] = useState(false)

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (source) params.set("source", source)
  if (remote) params.set("remote", remote)
  if (tab === "saved") params.set("saved", "true")
  if (tab === "applied") params.set("applied", "true")
  params.set("page", page.toString())
  params.set("limit", "24")

  const { data, isLoading } = useQuery({
    queryKey: ["discover", search, source, remote, tab, page],
    queryFn: async () => {
      const res = await fetch(`/api/discover?${params}`)
      return res.json()
    },
  })

  const { data: stats } = useQuery({
    queryKey: ["discover-stats"],
    queryFn: async () => {
      const res = await fetch("/api/discover/stats")
      return res.json()
    },
    refetchInterval: 30000,
  })

  async function triggerFetch() {
    setFetching(true)
    try {
      toast({ title: "Fetching latest jobs from all sources…", description: "This takes 20–60 seconds" })
      const res = await fetch("/api/discover/refresh", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        toast({ title: `✓ Found ${data.total} jobs`, description: `${data.inserted} new · ${data.updated} updated`, variant: "success" })
        qc.invalidateQueries({ queryKey: ["discover"] })
        qc.invalidateQueries({ queryKey: ["discover-stats"] })
      } else {
        toast({ title: "Fetch failed", variant: "destructive" })
      }
    } finally {
      setFetching(false)
    }
  }

  const refresh = () => qc.invalidateQueries({ queryKey: ["discover"] })
  const jobs = data?.jobs ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 24)

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-indigo-400" />
            Discover Jobs
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {stats?.total ?? 0} live jobs · DevOps, Cloud, SRE, Platform, K8s roles at startups & product companies
          </p>
        </div>
        <Button onClick={triggerFetch} loading={fetching} variant="secondary" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${fetching ? "animate-spin" : ""}`} />
          {fetching ? "Fetching…" : "Refresh Jobs"}
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {[
          { label: "Total Jobs", value: stats?.total ?? 0, icon: Briefcase, color: "text-indigo-400" },
          { label: "Saved", value: stats?.saved ?? 0, icon: Bookmark, color: "text-amber-400" },
          { label: "Applied", value: stats?.applied ?? 0, icon: CheckCircle, color: "text-blue-400" },
          { label: "Interviews", value: stats?.interviews ?? 0, icon: Calendar, color: "text-violet-400" },
          { label: "Offers", value: stats?.offers ?? 0, icon: Trophy, color: "text-emerald-400" },
          { label: "Rejected", value: stats?.rejected ?? 0, icon: XCircle, color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="bg-[#16161e] border border-[#2a2a3a] rounded-xl p-3 flex items-center gap-2">
            <s.icon className={`w-4 h-4 ${s.color} shrink-0`} />
            <div>
              <div className="font-bold text-white text-sm">{s.value}</div>
              <div className="text-[10px] text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Last fetched info */}
      {stats?.lastFetched && (
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Clock className="w-3 h-3" />
          Last updated {timeAgo(stats.lastFetched)}
          {stats?.bySource?.length > 0 && (
            <span className="ml-2">·
              {stats.bySource.slice(0, 5).map((s: any) => (
                <span key={s.source} className="ml-1">{SOURCE_LABELS[s.source] ?? s.source} ({s.count})</span>
              ))}
            </span>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            placeholder="Search by title, company, skill…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <Select value={source} onValueChange={v => { setSource(v); setPage(1) }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All sources" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All sources</SelectItem>
            {Object.entries(SOURCE_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={remote} onValueChange={v => { setRemote(v); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Any location" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any location</SelectItem>
            <SelectItem value="true">Remote only</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={v => { setTab(v); setPage(1) }}>
        <TabsList>
          <TabsTrigger value="all">All Jobs ({stats?.total ?? 0})</TabsTrigger>
          <TabsTrigger value="saved">Saved ({stats?.saved ?? 0})</TabsTrigger>
          <TabsTrigger value="applied">Applied ({stats?.applied ?? 0})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Job grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-500 font-medium">
            {stats?.total === 0 ? "No jobs yet — click Refresh Jobs to fetch live listings" : "No jobs match your filters"}
          </p>
          {stats?.total === 0 && (
            <Button onClick={triggerFetch} loading={fetching} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />Fetch Jobs Now
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {jobs.map((job: any) => (
                <JobCard key={job.id} job={job} onRefresh={refresh} />
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-sm text-gray-400">Page {page} of {totalPages} · {total} jobs</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
