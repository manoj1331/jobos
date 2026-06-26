import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireAuth()
  if (error) return error
  const { id } = await params

  const job = await prisma.discoveredJob.findUnique({
    where: { id },
    include: {
      saves: { where: { userId }, select: { id: true } },
      applications: { where: { userId } },
    },
  })
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({
    ...job,
    isSaved: job.saves.length > 0,
    application: job.applications[0] ?? null,
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireAuth()
  if (error) return error
  const { id } = await params
  const { action, notes, interviewAt, status } = await req.json()

  const job = await prisma.discoveredJob.findUnique({ where: { id } })
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (action === "save") {
    const existing = await prisma.userSavedJob.findUnique({
      where: { userId_discoveredJobId: { userId, discoveredJobId: id } },
    })
    if (existing) {
      await prisma.userSavedJob.delete({ where: { id: existing.id } })
      return NextResponse.json({ saved: false })
    }
    await prisma.userSavedJob.create({ data: { userId, discoveredJobId: id } })
    return NextResponse.json({ saved: true })
  }

  if (action === "apply") {
    await prisma.userJobApplication.upsert({
      where: { userId_discoveredJobId: { userId, discoveredJobId: id } },
      create: { userId, discoveredJobId: id, status: "applied", notes },
      update: { status: "applied", appliedAt: new Date() },
    })
    // Log activity
    await prisma.activity.create({
      data: {
        userId,
        type: "applied",
        title: `Applied to ${job.title}`,
        details: job.company,
      },
    })
    return NextResponse.json({ success: true, redirectUrl: job.applyUrl })
  }

  if (action === "update_status") {
    const app = await prisma.userJobApplication.upsert({
      where: { userId_discoveredJobId: { userId, discoveredJobId: id } },
      create: { userId, discoveredJobId: id, status: status ?? "applied", notes },
      update: {
        status: status ?? "applied",
        notes: notes ?? undefined,
        interviewAt: interviewAt ? new Date(interviewAt) : undefined,
      },
    })
    return NextResponse.json(app)
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
