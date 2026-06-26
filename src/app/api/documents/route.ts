import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { error, userId } = await requireAuth()
  if (error) return error
  const documents = await prisma.document.findMany({
    where: { userId },
    include: { jobUsage: true },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  })
  return NextResponse.json({ documents })
}

export async function POST(req: NextRequest) {
  const { error, userId } = await requireAuth()
  if (error) return error
  const body = await req.json()
  const document = await prisma.document.create({
    data: { userId, name: body.name, type: body.type, fileUrl: body.fileUrl ?? "", version: body.version ?? 1, notes: body.notes },
  })
  return NextResponse.json(document, { status: 201 })
}
