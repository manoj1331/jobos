import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-helpers"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join, extname } from "path"
import { randomUUID } from "crypto"

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]

const ALLOWED_EXTS = [".pdf", ".doc", ".docx", ".txt"]
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  const { error, userId } = await requireAuth()
  if (error) return error

  try {
    const formData = await req.formData()
    const files = formData.getAll("files") as File[]
    const category = (formData.get("category") as string) || "other"
    const name = formData.get("name") as string | null

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    const uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), "uploads")
    const userDir = join(uploadDir, userId)
    await mkdir(userDir, { recursive: true })

    const saved = []

    for (const file of files) {
      const ext = extname(file.name).toLowerCase()

      if (!ALLOWED_EXTS.includes(ext)) {
        return NextResponse.json({ error: `File type ${ext} not allowed` }, { status: 400 })
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 400 })
      }

      const uid = randomUUID()
      const filename = `${uid}${ext}`
      const filepath = join(userDir, filename)
      const bytes = await file.arrayBuffer()
      await writeFile(filepath, Buffer.from(bytes))

      const doc = await prisma.document.create({
        data: {
          userId,
          name: name || file.name.replace(ext, ""),
          type: category,
          fileUrl: `/api/documents/serve/${userId}/${filename}`,
          fileSize: file.size,
          mimeType: file.type,
          version: 1,
        },
      })

      saved.push(doc)
    }

    return NextResponse.json({ documents: saved }, { status: 201 })
  } catch (err) {
    console.error("[Upload]", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
