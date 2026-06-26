import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"
import { unlink } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireAuth()
  if (error) return error
  const { id } = await params
  const doc = await prisma.document.findFirst({ where: { id, userId } })
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const body = await req.json()
  const updated = await prisma.document.update({ where: { id }, data: body })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireAuth()
  if (error) return error
  const { id } = await params
  const doc = await prisma.document.findFirst({ where: { id, userId } })
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Delete physical file if it's a local upload
  if (doc.fileUrl.startsWith("/api/documents/serve/")) {
    const parts = doc.fileUrl.split("/")
    const filename = parts[parts.length - 1]
    const uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), "uploads")
    const filepath = join(uploadDir, userId, filename)
    if (existsSync(filepath)) {
      await unlink(filepath).catch(() => {})
    }
  }

  await prisma.document.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
