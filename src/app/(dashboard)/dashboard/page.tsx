"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  Briefcase, Building2, Users, TrendingUp, CheckCircle,
  XCircle, Clock, Send, Target, Calendar, AlertCircle,
  BarChart2, Activity
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { formatDate, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils"
import Link from "next/link"

async function fetchDashboard() {
  const res = await fetch("/api/dashboard")
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}

const statCards = [
  { key: "totalJobs", label: "Total Jobs", icon: Briefcase, color: "text-indigo-400", bg: "bg-indigo-600/10" },
  { key: "applied", label: "Applied", icon: Send, color: "text-blue-400", bg: "bg-blue-600/10" },
  { key: "interviews", label: "Interviews", icon: Calendar, color: "text-violet-400", bg: "bg-violet-600/10" },
  { key: "offers", label: "Offers", icon: Target, color: "text-emerald-400", bg: "bg-emerald-600/10" },
  { key: "accepted", label: "Accepted", icon: CheckCircle, color: "text-green-400", bg: "bg-green-600/10" },
  { key: "rejected", label: "Rejected", icon: XCircle, color: "text-red-400", bg: "bg-red-600/10" },
  { key: "responseRate", label: "Response Rate", icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-600/10", suffix: "%" },
  { key: "offerRate", label: "Offer Rate", icon: BarChart2, color: "text-cyan-400", bg: "bg-cyan-600/10", suffix: "%" },
  { key: "thisWeek", label: "This Week", icon: Activity, color: "text-purple-400", bg: "bg-purple-600/10" },
  { key: "thisMonth", label: "This Month", icon: Calendar, color: "text-pink-400", bg: "bg-pink-600/10" },
  { key: "totalCompanies", label: "Companies", icon: Building2, color: "text-orange-400", bg: "bg-orange-600/10" },
  { key: "totalRecruiters", label: "Recruiters", icon: Users, color: "text-rose-400", bg: "bg-rose-600/10" },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48 rounded-xl lg:col-span-2" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    )
  }

  const { stats, upcomingInterviews, upcomingDeadlines, recentActivity, monthlyData } = data ?? {}

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-0.5">Your job search at a glance</p>
      </div>

      {/* Stats grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
      >
        {statCards.map(card => {
          const Icon = card.icon
          const value = stats?.[card.key] ?? 0
          return (
            <motion.div key={card.key} variants={item}>
              <Card className="hover:border-[#3a3a4a] transition-colors">
                <CardContent className="p-4">
                  <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-3`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {value}{card.suffix ?? ""}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{card.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Charts + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly applications chart */}
        <motion.div variants={item} initial="hidden" animate="show" className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Applications Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyData?.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={monthlyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#16161e", border: "1px solid #2a2a3a", borderRadius: 8, color: "#fff" }}
                      cursor={{ fill: "rgba(99,102,241,0.1)" }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {(monthlyData ?? []).map((_: unknown, i: number) => (
                        <Cell key={i} fill={i === monthlyData.length - 1 ? "#6366f1" : "#2a2a3a"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-44 flex items-center justify-center text-gray-600 text-sm">
                  No application data yet. Start applying!
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming interviews */}
        <motion.div variants={item} initial="hidden" animate="show">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Upcoming Interviews
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingInterviews?.length === 0 && (
                <p className="text-gray-600 text-xs py-4 text-center">No upcoming interviews</p>
              )}
              {(upcomingInterviews ?? []).map((interview: any) => (
                <div key={interview.id} className="flex items-start gap-2 p-2 rounded-lg bg-[#1e1e2a]">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">
                      {interview.job?.title}
                    </div>
                    <div className="text-xs text-gray-400">{interview.job?.company?.name}</div>
                    <div className="text-xs text-indigo-400 mt-0.5">{formatDate(interview.date)}</div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{interview.type}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Deadlines */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              Deadlines This Week
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingDeadlines?.length === 0 && (
              <p className="text-gray-600 text-xs py-4 text-center">No deadlines this week</p>
            )}
            {(upcomingDeadlines ?? []).map((job: any) => (
              <div key={job.id} className="flex items-center gap-3 p-2 rounded-lg bg-[#1e1e2a]">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{job.title}</div>
                  <div className="text-xs text-gray-400">{job.company?.name}</div>
                </div>
                <div className="text-xs text-amber-400 shrink-0">{formatDate(job.deadline)}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-violet-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentActivity?.length === 0 && (
              <p className="text-gray-600 text-xs py-4 text-center">No recent activity</p>
            )}
            {(recentActivity ?? []).map((activity: any) => (
              <div key={activity.id} className="flex items-start gap-2.5 p-2 rounded-lg bg-[#1e1e2a]">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white">{activity.title}</div>
                  {activity.details && <div className="text-xs text-gray-500">{activity.details}</div>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
