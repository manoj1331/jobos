import { prisma } from "@/lib/prisma"
import { fetchRemoteOK } from "./remoteok"
import { fetchRemotive } from "./remotive"
import { fetchArbeitnow } from "./arbeitnow"
import { fetchJobicy } from "./jobicy"
import { fetchWeWorkRemotely } from "./weworkremotely"
import { fetchYCJobs } from "./ycjobs"
import { fetchJSearch } from "./jsearch"
import { fetchCutshort, fetchWellfound, fetchInstahyre } from "./india"
import { NormalizedJob } from "./constants"

export async function fetchAllJobs(): Promise<{ inserted: number; updated: number; total: number }> {
  console.log("[JobFetcher] Starting fetch — South India + Remote, 4 strict roles only")

  const fetchResults = await Promise.allSettled([
    fetchRemoteOK(),      // Remote worldwide — accessible from South India
    fetchRemotive(),      // Remote worldwide
    fetchArbeitnow(),     // Remote worldwide (filtered to remote only)
    fetchJobicy(),        // Remote worldwide
    fetchWeWorkRemotely(), // Remote worldwide
    fetchYCJobs(),        // YC startup jobs
    fetchJSearch(),       // India-specific: Bangalore, Hyderabad, Chennai (needs RAPIDAPI_KEY)
    fetchCutshort(),      // India startup jobs
    fetchWellfound(),     // India startup jobs
    fetchInstahyre(),     // Bangalore, Hyderabad, Chennai
  ])

  const names = ["RemoteOK","Remotive","Arbeitnow","Jobicy","WeWorkRemotely","YCJobs","JSearch","Cutshort","Wellfound","Instahyre"]

  const allJobs: NormalizedJob[] = []
  fetchResults.forEach((r, i) => {
    if (r.status === "fulfilled") {
      console.log(`[JobFetcher] ${names[i]}: ${r.value.length} matching jobs`)
      allJobs.push(...r.value)
    } else {
      console.error(`[JobFetcher] ${names[i]} failed:`, r.reason)
    }
  })

  // Deduplicate
  const unique = new Map<string, NormalizedJob>()
  for (const job of allJobs) unique.set(`${job.source}:${job.externalId}`, job)
  const jobs = [...unique.values()]
  console.log(`[JobFetcher] Total unique: ${jobs.length}`)

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
            data: { title: job.title, isActive: true, updatedAt: new Date() },
          })
          updated++
        } else {
          await prisma.discoveredJob.create({
            data: {
              externalId: job.externalId, source: job.source,
              title: job.title, company: job.company,
              companyLogo: job.companyLogo, companyWebsite: job.companyWebsite,
              location: job.location, isRemote: job.isRemote, isHybrid: job.isHybrid,
              salaryMin: job.salaryMin, salaryMax: job.salaryMax, salaryCurrency: job.salaryCurrency,
              description: job.description, skills: job.skills,
              applyUrl: job.applyUrl, jobType: job.jobType,
              postedAt: job.postedAt, companyType: job.companyType, isActive: true,
            },
          })
          inserted++
        }
      } catch {}
    }))
  }

  // Archive jobs older than 30 days
  await prisma.discoveredJob.updateMany({
    where: { updatedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, isActive: true },
    data: { isActive: false },
  })

  console.log(`[JobFetcher] Done — inserted: ${inserted}, updated: ${updated}`)
  return { inserted, updated, total: jobs.length }
}
