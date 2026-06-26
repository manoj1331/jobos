"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { STATUS_LABELS, PIPELINE_COLUMNS, formatSalary, PRIORITY_COLORS } from "@/lib/utils"
import { Briefcase, DollarSign } from "lucide-react"

async function fetchPipeline() {
  const res = await fetch("/api/pipeline")
  if (!res.ok) throw new Error("Failed")
  return res.json()
}

function KanbanCard({ job, isDragging = false }: { job: any; isDragging?: boolean }) {
  const priorityDot = { high: "bg-red-400", medium: "bg-amber-400", low: "bg-gray-500" }
  return (
    <div className={`kanban-card bg-[#1e1e2a] border border-[#2a2a3a] rounded-xl p-3 space-y-2 hover:border-[#3a3a4a] transition-all ${isDragging ? "opacity-50 scale-95 rotate-1 shadow-2xl" : ""}`}>
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-lg bg-[#2a2a3a] flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
          {job.company?.name?.[0] ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate leading-tight">{job.title}</div>
          <div className="text-xs text-gray-400 truncate">{job.company?.name}</div>
        </div>
        <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${priorityDot[job.priority as keyof typeof priorityDot] ?? "bg-gray-600"}`} />
      </div>
      <div className="flex items-center justify-between">
        {(job.salaryMin || job.salaryMax) ? (
          <span className="text-xs text-gray-400">{formatSalary(job.salaryMin, job.salaryMax)}</span>
        ) : <span />}
        {job._count?.interviews > 0 && (
          <Badge variant="secondary" className="text-[10px] py-0">{job._count.interviews} interviews</Badge>
        )}
        {job.matchScore != null && (
          <span className="text-xs text-indigo-400">{job.matchScore}%</span>
        )}
      </div>
    </div>
  )
}

function DraggableCard({ job }: { job: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: job.id, data: { job } })
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 999, position: "relative" as const } : undefined
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <KanbanCard job={job} isDragging={isDragging} />
    </div>
  )
}

function Column({ column, jobs }: { column: typeof PIPELINE_COLUMNS[0]; jobs: any[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  return (
    <div className="flex-shrink-0 w-64">
      <div className={`rounded-xl border-t-2 ${column.color} bg-[#16161e] border border-[#2a2a3a] border-t-0 h-full flex flex-col`}>
        <div className="flex items-center justify-between p-3 border-b border-[#2a2a3a]">
          <span className="text-xs font-semibold text-gray-300">{column.label}</span>
          <span className="text-xs font-bold text-gray-500 bg-[#2a2a3a] px-1.5 py-0.5 rounded-full">{jobs.length}</span>
        </div>
        <div
          ref={setNodeRef}
          className={`flex-1 p-2 space-y-2 min-h-32 transition-colors rounded-b-xl ${isOver ? "bg-indigo-600/5" : ""}`}
        >
          {jobs.map(job => (
            <DraggableCard key={job.id} job={job} />
          ))}
          {jobs.length === 0 && (
            <div className="h-20 flex items-center justify-center text-gray-700 text-xs border border-dashed border-[#2a2a3a] rounded-lg">
              Drop here
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const qc = useQueryClient()
  const [activeJob, setActiveJob] = useState<any>(null)
  const { data, isLoading } = useQuery({ queryKey: ["pipeline"], queryFn: fetchPipeline })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragStart(e: DragStartEvent) {
    setActiveJob(e.active.data.current?.job)
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveJob(null)
    const { active, over } = e
    if (!over || active.id === over.id) return

    const job = active.data.current?.job
    const newColumn = over.id as string

    if (job.boardColumn === newColumn) return

    // Optimistic update
    qc.setQueryData(["pipeline"], (old: any) => {
      if (!old) return old
      return {
        jobs: old.jobs.map((j: any) =>
          j.id === job.id ? { ...j, boardColumn: newColumn, status: newColumn } : j
        ),
      }
    })

    await fetch("/api/pipeline", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id, column: newColumn, order: 0 }),
    })

    qc.invalidateQueries({ queryKey: ["pipeline"] })
    qc.invalidateQueries({ queryKey: ["dashboard"] })
  }

  const jobs: any[] = data?.jobs ?? []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Pipeline</h1>
        <p className="text-gray-400 text-sm">{jobs.length} active jobs · Drag to update status</p>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_COLUMNS.slice(0, 6).map(c => (
            <Skeleton key={c.id} className="w-64 h-96 rounded-xl shrink-0" />
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-6 min-h-[calc(100vh-180px)]">
            {PIPELINE_COLUMNS.map(column => {
              const colJobs = jobs.filter(j => j.boardColumn === column.id)
              return <Column key={column.id} column={column} jobs={colJobs} />
            })}
          </div>
          <DragOverlay>
            {activeJob ? <KanbanCard job={activeJob} /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
