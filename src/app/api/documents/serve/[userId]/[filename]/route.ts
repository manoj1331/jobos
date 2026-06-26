import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-helpers"
import { readFile } from "fs/promises"
import { join, extname } from "path"
import { existsSync } from "fs"

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; filename: string }> }
) {
  const { error, userId } = await requireAuth()
  if (error) return error

  const { userId: fileUserId, filename } = await params

  // Users can only access their own files
  if (fileUserId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), "uploads")
  const filepath = join(uploadDir, fileUserId, filename)

  if (!existsSync(filepath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const ext = extname(filename).toLowerCase()
  const mimeType = MIME[ext] || "application/octet-stream"

  const inline = req.nextUrl.searchParams.get("preview") === "1"
  const bytes = await readFile(filepath)

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
      "Cache-Control": "private, max-age=3600",
    },
  })
}
