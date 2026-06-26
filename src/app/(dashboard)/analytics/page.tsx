"use client"

import { useQuery } from "@tanstack/react-query"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
  FunnelChart, Funnel, LabelList,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const COLORS = ["#6366f1","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899","#84cc16"]

const TooltipStyle = {
  contentStyle: { background: "#16161e", border: "1px solid #2a2a3a", borderRadius: 8, color: "#fff", fontSize: 12 },
  cursor: { fill: "rgba(99,102,241,0.08)" },
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => { const r = await fetch("/api/analytics"); return r.json() },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    )
  }

  const { funnel, monthlyApplications, topSkills, statusCounts, byLocation, byRemote, rejectionReasons, totals } = data ?? {}

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 text-sm">Deep insights into your job search</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Applied", value: totals?.applied ?? 0, color: "text-indigo-400" },
          { label: "Response Rate", value: `${totals?.responseRate ?? 0}%`, color: "text-emerald-400" },
          { label: "Offer Rate", value: `${totals?.offerRate ?? 0}%`, color: "text-amber-400" },
          { label: "Accepted", value: totals?.accepted ?? 0, color: "text-green-400" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Application funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300">Application Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnel} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="stage" type="category" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip {...TooltipStyle} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {(funnel ?? []).map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly applications */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300">Monthly Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyApplications ?? []} margin={{ left: -20 }}>
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TooltipStyle} />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", strokeWidth: 0, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top skills */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300">Most Required Skills</CardTitle>
          </CardHeader>
          <CardContent>
            {(topSkills ?? []).length === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-600 text-sm">Add skills to jobs to see data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={(topSkills ?? []).slice(0, 10)} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="skill" type="category" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip {...TooltipStyle} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* By remote */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300">Work Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byRemote ?? []} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} label={(props: any) => `${props.type} ${((props.percent ?? 0)*100).toFixed(0)}%`} labelLine={false}>
                  {(byRemote ?? []).map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...TooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By location */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300">Top Locations</CardTitle>
          </CardHeader>
          <CardContent>
            {(byLocation ?? []).length === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-600 text-sm">Add locations to jobs to see data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={(byLocation ?? []).slice(0, 8)} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="location" type="category" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip {...TooltipStyle} />
                  <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Rejection reasons */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300">Rejection Reasons</CardTitle>
          </CardHeader>
          <CardContent>
            {(rejectionReasons ?? []).length === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-600 text-sm">No rejection data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={rejectionReasons ?? []} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="reason" type="category" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip {...TooltipStyle} />
                  <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
