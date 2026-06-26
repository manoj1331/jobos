import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { error, userId } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") ?? ""
  const source = searchParams.get("source") ?? ""
  const remote = searchParams.get("remote")
  const saved = searchParams.get("saved") === "true"
  const applied = searchParams.get("applied") === "true"
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = parseInt(searchParams.get("limit") ?? "30")

  const where: any = { isActive: true }
  if (source) where.source = source
  if (remote === "true") where.isRemote = true
  if (remote === "hybrid") where.isHybrid = true
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
      { skills: { hasSome: [search] } },
    ]
  }

  if (saved) {
    where.saves = { some: { userId } }
  }
  if (applied) {
    where.applications = { some: { userId } }
  }

  const [jobs, total] = await Promise.all([
    prisma.discoveredJob.findMany({
      where,
      orderBy: [{ postedAt: "desc" }, { fetchedAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        saves: { where: { userId }, select: { id: true } },
        applications: { where: { userId }, select: { id: true, status: true, appliedAt: true } },
      },
    }),
    prisma.discoveredJob.count({ where }),
  ])

  const enriched = jobs.map(j => ({
    ...j,
    isSaved: j.saves.length > 0,
    application: j.applications[0] ?? null,
  }))

  return NextResponse.json({ jobs: enriched, total, page, limit })
}
