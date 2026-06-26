"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { CommandPalette } from "@/components/layout/command-palette"
import { JobForm } from "@/components/jobs/job-form"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [cmdOpen, setCmdOpen] = useState(false)
  const [jobFormOpen, setJobFormOpen] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  const openCmd = useCallback(() => setCmdOpen(true), [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCmdOpen(true)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f13]">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f0f13]">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onSearch={openCmd} onAddJob={() => setJobFormOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <JobForm open={jobFormOpen} onClose={() => setJobFormOpen(false)} onSuccess={() => setJobFormOpen(false)} />
    </div>
  )
}
