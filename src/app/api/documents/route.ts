import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { error, userId } = await requireAuth()
  if (error) return error

  const type = new URL(req.url).searchParams.get("type")
  const where: any = { userId }
  if (type) where.type = type

  const documents = await prisma.document.findMany({
    where,
    include: { jobUsage: { include: { job: { select: { title: true } } } } },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  })
  return NextResponse.json({ documents })
}

export async function POST(req: NextRequest) {
  const { error, userId } = await requireAuth()
  if (error) return error
  const body = await req.json()

  // Handle Google Drive / OneDrive import (URL-based)
  if (body.source === "gdrive" || body.source === "onedrive") {
    const doc = await prisma.document.create({
      data: {
        userId,
        name: body.name,
        type: body.category || "other",
        fileUrl: body.fileUrl,
        fileSize: body.fileSize,
        mimeType: body.mimeType || "application/pdf",
        version: 1,
        notes: `Imported from ${body.source === "gdrive" ? "Google Drive" : "OneDrive"}`,
      },
    })
    return NextResponse.json(doc, { status: 201 })
  }

  // Manual URL entry
  const doc = await prisma.document.create({
    data: {
      userId,
      name: body.name,
      type: body.type || "other",
      fileUrl: body.fileUrl ?? "",
      version: body.version ?? 1,
      notes: body.notes,
    },
  })
  return NextResponse.json(doc, { status: 201 })
}
