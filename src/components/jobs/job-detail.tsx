"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { X, ExternalLink, Edit, Calendar, Building2, MapPin, DollarSign, Briefcase, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { STATUS_LABELS, STATUS_COLORS, formatSalary, formatDate } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface JobDetailProps {
  job: any | null
  onClose: () => void
  onEdit: (job: any) => void
}

export function JobDetail({ job, onClose, onEdit }: JobDetailProps) {
  const qc = useQueryClient()

  const { data: fullJob } = useQuery({
    queryKey: ["job", job?.id],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${job.id}`)
      return res.json()
    },
    enabled: !!job?.id,
  })

  async function updateStatus(status: string) {
    await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, boardColumn: status }),
    })
    toast({ title: `Status updated to ${STATUS_LABELS[status]}`, variant: "success" })
    qc.invalidateQueries({ queryKey: ["job", job.id] })
    qc.invalidateQueries({ queryKey: ["jobs"] })
    qc.invalidateQueries({ queryKey: ["pipeline"] })
  }

  if (!job) return null

  const j = fullJob ?? job

  return (
    <div className="fixed inset-0 z-40 flex" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-[#12121a] border-l border-[#2a2a3a] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b border-[#2a2a3a]">
          <div className="w-10 h-10 rounded-xl bg-[#2a2a3a] flex items-center justify-center text-sm font-bold text-white shrink-0">
            {j.company?.name?.[0] ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-white truncate">{j.title}</h2>
            <p className="text-sm text-gray-400">{j.company?.name}</p>
          </div>
          <div className="flex items-center gap-1">
            {j.jobUrl && (
              <a href={j.jobUrl} target="_blank" rel="noreferrer">
                <Button variant="ghost" size="icon-sm"><ExternalLink className="w-3.5 h-3.5" /></Button>
              </a>
            )}
            <Button variant="ghost" size="icon-sm" onClick={() => onEdit(j)}>
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-[#2a2a3a]">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${STATUS_COLORS[j.status] ?? "bg-gray-600"}`}>
            {STATUS_LABELS[j.status] ?? j.status}
          </span>
          {j.priority && (
            <Badge variant={j.priority === "high" ? "destructive" : j.priority === "medium" ? "warning" : "secondary"} className="text-xs">
              {j.priority} priority
            </Badge>
          )}
          {j.matchScore != null && (
            <Badge variant="default" className="text-xs">{j.matchScore}% match</Badge>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-5 space-y-5">
            {/* Quick facts */}
            <div className="grid grid-cols-2 gap-3">
              {j.location && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  {j.location}
                </div>
              )}
              {(j.salaryMin || j.salaryMax) && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <DollarSign className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  {formatSalary(j.salaryMin, j.salaryMax)}
                </div>
              )}
              {j.remote && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Briefcase className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  {j.remote}
                </div>
              )}
              {j.applicationDate && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  Applied {formatDate(j.applicationDate)}
                </div>
              )}
              {j.deadline && (
                <div className="flex items-center gap-2 text-sm text-red-400">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  Deadline {formatDate(j.deadline)}
                </div>
              )}
            </div>

            {/* Quick status change */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Quick Status Update</p>
              <div className="flex flex-wrap gap-1.5">
                {["applied", "phone_screen", "technical", "offer", "accepted", "rejected"].map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      j.status === s
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-transparent border-[#2a2a3a] text-gray-400 hover:border-[#3a3a4a] hover:text-white"
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <Tabs defaultValue="overview">
              <TabsList className="w-full">
                <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                <TabsTrigger value="interviews" className="flex-1">Interviews ({j.interviews?.length ?? 0})</TabsTrigger>
                <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {j.requiredSkills?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Required Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {j.requiredSkills.map((s: string) => (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-indigo-600/20 text-indigo-300 text-xs border border-indigo-600/30">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {j.notes && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Notes</p>
                    <div className="text-sm text-gray-300 bg-[#1e1e2a] rounded-lg p-3 whitespace-pre-wrap">{j.notes}</div>
                  </div>
                )}
                {j.referral && (
                  <div className="p-3 bg-emerald-950/30 border border-emerald-800/30 rounded-lg text-sm text-emerald-300">
                    Referral: {j.referralName ?? "Yes"}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="interviews" className="space-y-2">
                {j.interviews?.length === 0 ? (
                  <p className="text-gray-600 text-sm text-center py-6">No interviews yet</p>
                ) : (
                  j.interviews?.map((interview: any) => (
                    <div key={interview.id} className="p-3 bg-[#1e1e2a] rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white capitalize">{interview.type.replace("_", " ")}</span>
                        <span className="text-xs text-gray-400">{formatDate(interview.date)}</span>
                      </div>
                      {interview.outcome && (
                        <Badge variant={interview.outcome === "passed" ? "success" : interview.outcome === "failed" ? "destructive" : "secondary"}>
                          {interview.outcome}
                        </Badge>
                      )}
                      {interview.notes && <p className="text-xs text-gray-400">{interview.notes}</p>}
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="activity" className="space-y-2">
                {j.activities?.length === 0 ? (
                  <p className="text-gray-600 text-sm text-center py-6">No activity yet</p>
                ) : (
                  j.activities?.map((a: any) => (
                    <div key={a.id} className="flex items-start gap-2.5 p-2 rounded-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                      <div>
                        <div className="text-xs text-white">{a.title}</div>
                        <div className="text-xs text-gray-500">{formatDate(a.createdAt)}</div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
