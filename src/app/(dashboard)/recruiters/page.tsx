"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, Link2, Mail, Trash2, Edit, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RecruiterForm } from "@/components/recruiters/recruiter-form"
import { toast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"

const statusColors: Record<string, string> = {
  new: "bg-gray-600/20 text-gray-300 border-gray-600/30",
  warm: "bg-amber-600/20 text-amber-300 border-amber-600/30",
  hot: "bg-red-600/20 text-red-300 border-red-600/30",
  cold: "bg-blue-600/20 text-blue-300 border-blue-600/30",
  connected: "bg-emerald-600/20 text-emerald-300 border-emerald-600/30",
}

export default function RecruitersPage() {
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editRecruiter, setEditRecruiter] = useState<any>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["recruiters", search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : ""
      const res = await fetch(`/api/recruiters${params}`)
      return res.json()
    },
  })

  async function deleteRecruiter(id: string) {
    if (!confirm("Delete this recruiter?")) return
    await fetch(`/api/recruiters/${id}`, { method: "DELETE" })
    toast({ title: "Recruiter deleted", variant: "success" })
    qc.invalidateQueries({ queryKey: ["recruiters"] })
  }

  const recruiters = data?.recruiters ?? []

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Recruiters</h1>
          <p className="text-gray-400 text-sm">{recruiters.length} recruiters in your network</p>
        </div>
        <Button onClick={() => { setEditRecruiter(null); setFormOpen(true) }}>
          <Plus className="w-4 h-4" /> Add Recruiter
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <Input placeholder="Search recruiters..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
      ) : recruiters.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No recruiters yet. Start building your network!</div>
      ) : (
        <div className="bg-[#16161e] border border-[#2a2a3a] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3a]">
                {["Name", "Company", "Email", "Last Contact", "Next Follow-up", "Status", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a3a]">
              {recruiters.map((r: any) => (
                <tr key={r.id} className="hover:bg-[#1e1e2a] transition-colors group">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{r.name}</div>
                    {r.title && <div className="text-xs text-gray-400">{r.title}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-300">{r.company?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    {r.email ? (
                      <a href={`mailto:${r.email}`} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {r.email}
                      </a>
                    ) : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(r.lastContact) ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {r.nextFollowUp ? (
                      <span className="text-amber-400">{formatDate(r.nextFollowUp)}</span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${statusColors[r.relationshipStatus] ?? statusColors.new}`}>
                      {r.relationshipStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      {r.linkedin && (
                        <a href={r.linkedin.startsWith("http") ? r.linkedin : `https://${r.linkedin}`} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="icon-sm"><Link2 className="w-3.5 h-3.5" /></Button>
                        </a>
                      )}
                      <Button variant="ghost" size="icon-sm" onClick={() => { setEditRecruiter(r); setFormOpen(true) }}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="text-red-400" onClick={() => deleteRecruiter(r.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RecruiterForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditRecruiter(null) }}
        onSuccess={() => { setFormOpen(false); setEditRecruiter(null) }}
        initialData={editRecruiter ?? undefined}
      />
    </div>
  )
}
