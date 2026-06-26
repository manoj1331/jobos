import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { error, userId } = await requireAuth()
  if (error) return error

  const [total, saved, applications, bySource, byStatus, recentJobs] = await Promise.all([
    prisma.discoveredJob.count({ where: { isActive: true } }),
    prisma.userSavedJob.count({ where: { userId } }),
    prisma.userJobApplication.findMany({ where: { userId } }),
    prisma.discoveredJob.groupBy({
      by: ["source"],
      where: { isActive: true },
      _count: { source: true },
      orderBy: { _count: { source: "desc" } },
    }),
    prisma.userJobApplication.groupBy({
      by: ["status"],
      where: { userId },
      _count: { status: true },
    }),
    prisma.discoveredJob.findMany({
      where: { isActive: true },
      orderBy: { fetchedAt: "desc" },
      take: 1,
      select: { fetchedAt: true },
    }),
  ])

  const statusMap = Object.fromEntries(byStatus.map(s => [s.status, s._count.status]))

  return NextResponse.json({
    total,
    saved,
    applied: applications.length,
    interviews: statusMap["interview"] ?? 0,
    offers: statusMap["offer"] ?? 0,
    rejected: statusMap["rejected"] ?? 0,
    bySource: bySource.map(s => ({ source: s.source, count: s._count.source })),
    lastFetched: recentJobs[0]?.fetchedAt ?? null,
  })
}
