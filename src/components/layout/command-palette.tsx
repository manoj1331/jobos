"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Briefcase, Building2, Users, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchResult {
  type: "job" | "company" | "recruiter"
  id: string
  title: string
  subtitle: string
  url: string
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      return
    }
    const timeout = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.results ?? [])
        setSelected(0)
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    if (!open) {
      setQuery("")
      setResults([])
    }
  }, [open])

  const navigate = useCallback((url: string) => {
    router.push(url)
    onClose()
  }, [router, onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowDown") setSelected(s => Math.min(s + 1, results.length - 1))
      if (e.key === "ArrowUp") setSelected(s => Math.max(s - 1, 0))
      if (e.key === "Enter" && results[selected]) navigate(results[selected].url)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, results, selected, navigate, onClose])

  if (!open) return null

  const icons = { job: Briefcase, company: Building2, recruiter: Users }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl bg-[#16161e] border border-[#2a2a3a] rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a3a]">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search jobs, companies, recruiters..."
            className="flex-1 bg-transparent text-white placeholder:text-gray-500 text-sm outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")}>
              <X className="w-4 h-4 text-gray-500 hover:text-gray-300" />
            </button>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="py-2 max-h-80 overflow-y-auto">
            {results.map((r, i) => {
              const Icon = icons[r.type]
              return (
                <button
                  key={r.id}
                  onClick={() => navigate(r.url)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                    i === selected ? "bg-indigo-600/20 text-white" : "text-gray-300 hover:bg-[#1e1e2a]"
                  )}
                >
                  <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{r.title}</div>
                    {r.subtitle && <div className="text-xs text-gray-500 truncate">{r.subtitle}</div>}
                  </div>
                  <span className="ml-auto text-xs text-gray-600 capitalize shrink-0">{r.type}</span>
                </button>
              )
            })}
          </div>
        )}

        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="py-12 text-center text-gray-500 text-sm">No results for "{query}"</div>
        )}

        {!query && (
          <div className="py-6 px-4 text-center text-gray-600 text-xs">
            Type to search across all your jobs, companies, and recruiters
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-2 border-t border-[#2a2a3a] text-xs text-gray-600">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  )
}
