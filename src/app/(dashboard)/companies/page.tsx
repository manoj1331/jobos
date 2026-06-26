"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Plus, Search, Star, Globe, ExternalLink, Trash2, Users, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CompanyForm } from "@/components/companies/company-form"
import { toast } from "@/hooks/use-toast"

async function fetchCompanies(search: string, favorite: boolean) {
  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (favorite) params.set("favorite", "true")
  const res = await fetch(`/api/companies?${params}`)
  if (!res.ok) throw new Error("Failed")
  return res.json()
}

export default function CompaniesPage() {
  const [search, setSearch] = useState("")
  const [favOnly, setFavOnly] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editCompany, setEditCompany] = useState<any>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["companies", search, favOnly],
    queryFn: () => fetchCompanies(search, favOnly),
  })

  async function toggleFavorite(id: string, current: boolean, e: React.MouseEvent) {
    e.stopPropagation()
    await fetch(`/api/companies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !current }),
    })
    qc.invalidateQueries({ queryKey: ["companies"] })
  }

  async function deleteCompany(id: string) {
    if (!confirm("Delete this company?")) return
    await fetch(`/api/companies/${id}`, { method: "DELETE" })
    toast({ title: "Company deleted", variant: "success" })
    qc.invalidateQueries({ queryKey: ["companies"] })
  }

  const companies = data?.companies ?? []

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Companies</h1>
          <p className="text-gray-400 text-sm">{companies.length} companies tracked</p>
        </div>
        <Button onClick={() => { setEditCompany(null); setFormOpen(true) }}>
          <Plus className="w-4 h-4" /> Add Company
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input placeholder="Search companies..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button
          variant={favOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setFavOnly(!favOnly)}
          className="gap-1.5"
        >
          <Star className={`w-3.5 h-3.5 ${favOnly ? "fill-current" : ""}`} />
          Favorites
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p>No companies yet. Add your first company!</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {companies.map((company: any) => (
            <motion.div
              key={company.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#16161e] border border-[#2a2a3a] rounded-xl p-4 space-y-3 hover:border-[#3a3a4a] transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2a2a3a] flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {company.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{company.name}</div>
                  {company.industry && <div className="text-xs text-gray-400">{company.industry}</div>}
                </div>
                <button onClick={e => toggleFavorite(company.id, company.isFavorite, e)}>
                  <Star className={`w-4 h-4 transition-colors ${company.isFavorite ? "fill-amber-400 text-amber-400" : "text-gray-600 hover:text-amber-400"}`} />
                </button>
              </div>

              <div className="space-y-1.5">
                {company.location && <div className="text-xs text-gray-400">📍 {company.location}</div>}
                {company.remotePolicy !== "unknown" && (
                  <div className="text-xs text-gray-400">🏠 {company.remotePolicy}</div>
                )}
                {company.visaSponsorship && (
                  <div className="text-xs text-emerald-400">✓ Visa sponsorship</div>
                )}
                {company.glassdoorRating && (
                  <div className="text-xs text-amber-400">★ {company.glassdoorRating} Glassdoor</div>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {company._count?.jobs ?? 0} jobs</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {company._count?.recruiters ?? 0} recruiters</span>
              </div>

              {company.techStack?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {company.techStack.slice(0, 4).map((t: string) => (
                    <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-[#2a2a3a] text-gray-400">{t}</span>
                  ))}
                  {company.techStack.length > 4 && (
                    <span className="text-[10px] text-gray-600">+{company.techStack.length - 4}</span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {company.website && (
                  <a href={company.website} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="icon-sm"><Globe className="w-3 h-3" /></Button>
                  </a>
                )}
                <Button variant="ghost" size="icon-sm" onClick={() => { setEditCompany(company); setFormOpen(true) }}>
                  <ExternalLink className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon-sm" className="text-red-400" onClick={() => deleteCompany(company.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <CompanyForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditCompany(null) }}
        onSuccess={() => { setFormOpen(false); setEditCompany(null) }}
        initialData={editCompany ?? undefined}
      />
    </div>
  )
}
