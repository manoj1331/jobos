import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { fetchAllJobs } from "@/lib/fetchers"

export const maxDuration = 300

export async function POST(req: NextRequest) {
  // Allow either authenticated session OR cron secret
  const cronSecret = req.headers.get("x-cron-secret")
  const validCron = cronSecret && cronSecret === (process.env.CRON_SECRET || "jobos-cron-secret")

  if (!validCron) {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const result = await fetchAllJobs()
    return NextResponse.json({ success: true, ...result })
  } catch (e) {
    console.error("Fetch error:", e)
    return NextResponse.json({ error: "Fetch failed", detail: String(e) }, { status: 500 })
  }
}
