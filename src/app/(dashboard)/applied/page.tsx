"use client"

import { useQuery } from "@tanstack/react-query"
import { CheckCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

const STATUS_COLORS: Record<string, string> = {
  applied: "bg-blue-600/20 text-blue-300 border-blue-600/30",
  interview: "bg-violet-600/20 text-violet-300 border-violet-600/30",
  offer: "bg-emerald-600/20 text-emerald-300 border-emerald-600/30",
  rejected: "bg-red-600/20 text-red-300 border-red-600/30",
}

export default function AppliedPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["applied-jobs"],
    queryFn: () => fetch("/api/discover?applied=true&limit=100").then(r => r.json()),
  })

  const jobs = data?.jobs ?? []

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Applied Jobs</h1>
        <p className="text-gray-500 text-xs mt-0.5">{jobs.length} applications tracked</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <CheckCircle className="w-8 h-8 mx-auto mb-3 text-gray-700" />
          <p>No applications tracked yet</p>
          <Link href="/discover"><Button className="mt-4" variant="secondary" size="sm">Find Jobs</Button></Link>
        </div>
      ) : (
        <div className="bg-[#16161e] border border-[#2a2a3a] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3a]">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Job</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium hidden sm:table-cell">Location</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium hidden md:table-cell">Applied</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a3a]">
              {jobs.map((job: any) => (
                <tr key={job.id} className="hover:bg-[#1e1e2a] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{job.title}</div>
                    <div className="text-xs text-gray-400">{job.company}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 hidden sm:table-cell">{job.location}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[job.application?.status] ?? "bg-gray-600/20 text-gray-400 border-gray-600/30"}`}>
                      {job.application?.status ?? "applied"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                    {formatDate(job.application?.appliedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a href={job.applyUrl} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="ghost" className="text-xs h-7">View</Button>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
