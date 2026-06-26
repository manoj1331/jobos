"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  format, addMonths, subMonths,
} from "date-fns"

export default function CalendarPage() {
  const [current, setCurrent] = useState(new Date())

  const { data: jobsData } = useQuery({
    queryKey: ["jobs-calendar"],
    queryFn: async () => { const r = await fetch("/api/jobs?limit=200"); return r.json() },
  })
  const { data: remindersData } = useQuery({
    queryKey: ["reminders"],
    queryFn: async () => { const r = await fetch("/api/reminders"); return r.json() },
  })

  const jobs = jobsData?.jobs ?? []
  const reminders = remindersData?.reminders ?? []

  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  function getEventsForDay(day: Date) {
    const events: { type: string; label: string; color: string }[] = []

    jobs.forEach((job: any) => {
      job.interviews?.forEach((iv: any) => {
        if (isSameDay(new Date(iv.date), day)) {
          events.push({ type: "interview", label: `Interview: ${job.title}`, color: "bg-indigo-500" })
        }
      })
      if (job.deadline && isSameDay(new Date(job.deadline), day)) {
        events.push({ type: "deadline", label: `Deadline: ${job.title}`, color: "bg-red-500" })
      }
      if (job.lastFollowUp && isSameDay(new Date(job.lastFollowUp), day)) {
        events.push({ type: "followup", label: `Follow-up: ${job.title}`, color: "bg-amber-500" })
      }
    })

    reminders.forEach((r: any) => {
      if (isSameDay(new Date(r.dueAt), day)) {
        events.push({ type: "reminder", label: r.title, color: "bg-violet-500" })
      }
    })

    return events
  }

  const upcomingEvents = [
    ...jobs.flatMap((job: any) => [
      ...(job.interviews ?? []).map((iv: any) => ({
        date: new Date(iv.date),
        label: `Interview: ${job.title}`,
        sub: job.company?.name,
        color: "bg-indigo-500",
      })),
      ...(job.deadline ? [{ date: new Date(job.deadline), label: `Deadline: ${job.title}`, sub: job.company?.name, color: "bg-red-500" }] : []),
    ]),
    ...reminders.map((r: any) => ({
      date: new Date(r.dueAt),
      label: r.title,
      sub: r.description,
      color: "bg-violet-500",
    })),
  ]
    .filter(e => e.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 10)

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold text-white">Calendar</h1>
        <p className="text-gray-400 text-sm">Interviews, deadlines, and reminders</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Calendar */}
        <div className="lg:col-span-3 bg-[#16161e] border border-[#2a2a3a] rounded-xl p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">{format(current, "MMMM yyyy")}</h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setCurrent(subMonths(current, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCurrent(new Date())}>Today</Button>
              <Button variant="ghost" size="icon" onClick={() => setCurrent(addMonths(current, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map(day => {
              const events = getEventsForDay(day)
              const inMonth = isSameMonth(day, current)
              const today = isToday(day)
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[72px] p-1 rounded-lg border transition-colors ${
                    today ? "border-indigo-500 bg-indigo-600/10" :
                    inMonth ? "border-transparent hover:border-[#2a2a3a] hover:bg-[#1e1e2a]" :
                    "border-transparent opacity-30"
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 ${today ? "text-indigo-400" : inMonth ? "text-gray-300" : "text-gray-600"}`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {events.slice(0, 2).map((e, i) => (
                      <div key={i} className={`text-[9px] px-1 py-0.5 rounded text-white truncate ${e.color}`}>
                        {e.label}
                      </div>
                    ))}
                    {events.length > 2 && (
                      <div className="text-[9px] text-gray-500 px-1">+{events.length - 2} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#2a2a3a]">
            {[
              { color: "bg-indigo-500", label: "Interview" },
              { color: "bg-red-500", label: "Deadline" },
              { color: "bg-amber-500", label: "Follow-up" },
              { color: "bg-violet-500", label: "Reminder" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className={`w-2 h-2 rounded-full ${l.color}`} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming events */}
        <div className="bg-[#16161e] border border-[#2a2a3a] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <CalIcon className="w-3.5 h-3.5 text-indigo-400" />
            Upcoming
          </h3>
          <div className="space-y-2">
            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-8">No upcoming events</p>
            ) : upcomingEvents.map((e, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-[#1e1e2a]">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${e.color}`} />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-white truncate">{e.label}</div>
                  {e.sub && <div className="text-xs text-gray-500 truncate">{e.sub}</div>}
                  <div className="text-xs text-indigo-400 mt-0.5">{format(e.date, "MMM d, h:mm a")}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
