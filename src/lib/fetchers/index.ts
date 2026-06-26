import { prisma } from "@/lib/prisma"
import { fetchNaukri } from "./naukri"
import { fetchJSearch } from "./jsearch"
import { fetchWellfound } from "./wellfound"
import { fetchRemoteOK } from "./remoteok"
import { fetchRemotive } from "./remotive"
import { NormalizedJob } from "./constants"

export async function fetchAllJobs(): Promise<{ inserted: number; updated: number; total: number; sources: Record<string, number> }> {
  console.log("[JobFetcher] Starting — India jobs, 4 roles, 3-4 yrs exp")

  const [naukri, jsearch, wellfound, remoteok, remotive] = await Promise.allSettled([
    fetchNaukri(),      // Naukri India — primary India source
    fetchJSearch(),     // LinkedIn + Indeed + Glassdoor + Google Jobs (needs RAPIDAPI_KEY)
    fetchWellfound(),   // Startup jobs India
    fetchRemoteOK(),    // Remote worldwide — India-accessible
    fetchRemotive(),    // Remote worldwide — India-accessible
  ])

  const all: NormalizedJob[] = []
  const sourceCounts: Record<string, number> = {}

  const settled = [
    { name: "naukri", r: naukri },
    { name: "jsearch", r: jsearch },
    { name: "wellfound", r: wellfound },
    { name: "remoteok", r: remoteok },
    { name: "remotive", r: remotive },
  ]

  for (const { name, r } of settled) {
    if (r.status === "fulfilled") {
      sourceCounts[name] = r.value.length
      all.push(...r.value)
    } else {
      console.error(`[JobFetcher] ${name} failed:`, r.reason)
      sourceCounts[name] = 0
    }
  }

  // Deduplicate
  const seen = new Map<string, NormalizedJob>()
  for (const job of all) seen.set(`${job.source}:${job.externalId}`, job)
  const jobs = [...seen.values()]

  console.log(`[JobFetcher] Unique jobs after dedup: ${jobs.length}`)

  let inserted = 0, updated = 0

  for (let i = 0; i < jobs.length; i += 50) {
    await Promise.allSettled(jobs.slice(i, i + 50).map(async job => {
      try {
        const existing = await prisma.discoveredJob.findUnique({
          where: { externalId_source: { externalId: job.externalId, source: job.source } },
        })
        if (existing) {
          await prisma.discoveredJob.update({
            where: { id: existing.id },
            data: { isActive: true, updatedAt: new Date() },
          })
          updated++
        } else {
          await prisma.discoveredJob.create({
            data: {
              externalId: job.externalId,
              source: job.source,
              title: job.title,
              company: job.company,
              companyLogo: job.companyLogo,
              location: job.location,
              isRemote: job.isRemote,
              isHybrid: job.isHybrid,
              description: job.description,
              skills: job.skills,
              applyUrl: job.applyUrl,
              jobType: job.jobType,
              postedAt: job.postedAt,
              isActive: true,
              salaryMin: job.salaryMin,
              salaryMax: job.salaryMax,
              salaryCurrency: job.salaryCurrency,
              experienceMin: job.experienceMin,
              experienceMax: job.experienceMax,
            },
          })
          inserted++
        }
      } catch {}
    }))
  }

  // Mark jobs not seen in 30 days as inactive
  await prisma.discoveredJob.updateMany({
    where: { updatedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, isActive: true },
    data: { isActive: false },
  })

  console.log(`[JobFetcher] Done — inserted: ${inserted}, updated: ${updated}`)
  return { inserted, updated, total: jobs.length, sources: sourceCounts }
}
