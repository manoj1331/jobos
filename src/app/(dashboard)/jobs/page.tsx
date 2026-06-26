"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Plus, Search, Filter, ExternalLink, Trash2, Edit, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { JobForm } from "@/components/jobs/job-form"
import { JobDetail } from "@/components/jobs/job-detail"
import { STATUS_LABELS, STATUS_COLORS, formatSalary, formatDate, PRIORITY_COLORS } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

async function fetchJobs(params: Record<string, string>) {
  const q = new URLSearchParams(params).toString()
  const res = await fetch(`/api/jobs?${q}`)
  if (!res.ok) throw new Error("Failed")
  return res.json()
}

export default function JobsPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [priority, setPriority] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editJob, setEditJob] = useState<any>(null)
  const [detailJob, setDetailJob] = useState<any>(null)
  const qc = useQueryClient()

  const params: Record<string, string> = {}
  if (search) params.search = search
  if (status !== "all") params.status = status
  if (priority) params.priority = priority

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", params],
    queryFn: () => fetchJobs(params),
  })

  async function deleteJob(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm("Delete this job?")) return
    await fetch(`/api/jobs/${id}`, { method: "DELETE" })
    toast({ title: "Job deleted", variant: "success" })
    qc.invalidateQueries({ queryKey: ["jobs"] })
  }

  const jobs = data?.jobs ?? []

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Jobs</h1>
          <p className="text-gray-400 text-sm">{data?.total ?? 0} jobs tracked</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Job
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            placeholder="Search jobs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="saved">Saved</SelectItem>
            <SelectItem value="applied">Applied</SelectItem>
            <SelectItem value="phone_screen">Phone Screen</SelectItem>
            <SelectItem value="technical">Technical</SelectItem>
            <SelectItem value="offer">Offer</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Any priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any priority</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p>No jobs found. Add your first job!</p>
        </div>
      ) : (
        <div className="bg-[#16161e] border border-[#2a2a3a] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3a]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Job</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Salary</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Applied</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Match</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a3a]">
              {jobs.map((job: any) => (
                <motion.tr
                  key={job.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setDetailJob(job)}
                  className="hover:bg-[#1e1e2a] cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#2a2a3a] flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
                        {job.company?.name?.[0] ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-white truncate flex items-center gap-1.5">
                          {job.title}
                          {job.isDuplicate && (
                            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-gray-400 truncate">{job.company?.name} {job.location ? `· ${job.location}` : ""}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 hidden md:table-cell">
                    {formatSalary(job.salaryMin, job.salaryMax) ?? <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-white ${STATUS_COLORS[job.status] ?? "bg-gray-600"}`}>
                      {STATUS_LABELS[job.status] ?? job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                    {formatDate(job.applicationDate) ?? "—"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {job.matchScore != null ? (
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-16 bg-[#2a2a3a] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${job.matchScore}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{job.matchScore}%</span>
                      </div>
                    ) : <span className="text-gray-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      {job.jobUrl && (
                        <a href={job.jobUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon-sm"><ExternalLink className="w-3.5 h-3.5" /></Button>
                        </a>
                      )}
                      <Button variant="ghost" size="icon-sm" onClick={e => { e.stopPropagation(); setEditJob(job); setFormOpen(true) }}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="text-red-400 hover:text-red-300" onClick={e => deleteJob(job.id, e)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <JobForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditJob(null) }}
        onSuccess={() => { setFormOpen(false); setEditJob(null) }}
        initialData={editJob ?? undefined}
      />
      <JobDetail job={detailJob} onClose={() => setDetailJob(null)} onEdit={j => { setDetailJob(null); setEditJob(j); setFormOpen(true) }} />
    </div>
  )
}

function Briefcase({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  )
}
