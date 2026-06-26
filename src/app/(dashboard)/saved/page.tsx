"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Bookmark } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SavedPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["saved-jobs"],
    queryFn: () => fetch("/api/discover?saved=true&limit=50").then(r => r.json()),
  })

  const jobs = data?.jobs ?? []

  return (
    <div className="max-w-4xl space-y-4">
      <h1 className="text-xl font-bold text-white">Saved Jobs</h1>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Bookmark className="w-8 h-8 mx-auto mb-3 text-gray-700" />
          <p>No saved jobs yet</p>
          <Link href="/discover"><Button className="mt-4" variant="secondary" size="sm">Browse Jobs</Button></Link>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job: any) => (
            <div key={job.id} className="bg-[#16161e] border border-[#2a2a3a] rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white text-sm">{job.title}</div>
                <div className="text-xs text-gray-400">{job.company} · {job.location}</div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                job.application?.status === "applied" ? "bg-blue-600/20 text-blue-300 border-blue-600/30" :
                job.application?.status === "interview" ? "bg-violet-600/20 text-violet-300 border-violet-600/30" :
                "bg-amber-600/20 text-amber-300 border-amber-600/30"
              }`}>
                {job.application?.status ?? "Saved"}
              </span>
              <a href={job.applyUrl} target="_blank" rel="noreferrer">
                <Button size="sm" variant="secondary" className="text-xs h-7">Apply</Button>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
