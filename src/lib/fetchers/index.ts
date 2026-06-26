import { prisma } from "@/lib/prisma"
import { fetchRemoteOK } from "./remoteok"
import { fetchRemotive } from "./remotive"
import { fetchArbeitnow } from "./arbeitnow"
import { fetchJobicy } from "./jobicy"
import { fetchWeWorkRemotely } from "./weworkremotely"
import { fetchYCJobs } from "./ycjobs"
import { fetchJSearch } from "./jsearch"
import { NormalizedJob } from "./constants"

export async function fetchAllJobs(): Promise<{ inserted: number; updated: number; total: number }> {
  console.log("[JobFetcher] Starting fetch from all sources...")

  const fetchResults = await Promise.allSettled([
    fetchRemoteOK(),
    fetchRemotive(),
    fetchArbeitnow(),
    fetchJobicy(),
    fetchWeWorkRemotely(),
    fetchYCJobs(),
    fetchJSearch(),
  ])

  const allJobs: NormalizedJob[] = []
  const sourceNames = ["RemoteOK", "Remotive", "Arbeitnow", "Jobicy", "WeWorkRemotely", "YCJobs", "JSearch"]

  fetchResults.forEach((result, i) => {
    if (result.status === "fulfilled") {
      console.log(`[JobFetcher] ${sourceNames[i]}: ${result.value.length} jobs`)
      allJobs.push(...result.value)
    } else {
      console.error(`[JobFetcher] ${sourceNames[i]} failed:`, result.reason)
    }
  })

  // Deduplicate by externalId+source
  const unique = new Map<string, NormalizedJob>()
  for (const job of allJobs) {
    unique.set(`${job.source}:${job.externalId}`, job)
  }

  const jobs = [...unique.values()]
  console.log(`[JobFetcher] Total unique jobs: ${jobs.length}`)

  let inserted = 0
  let updated = 0

  // Upsert in batches
  const batchSize = 50
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize)

    await Promise.allSettled(
      batch.map(async job => {
        try {
          const existing = await prisma.discoveredJob.findUnique({
            where: { externalId_source: { externalId: job.externalId, source: job.source } },
          })

          if (existing) {
            await prisma.discoveredJob.update({
              where: { id: existing.id },
              data: {
                title: job.title,
                isActive: true,
                updatedAt: new Date(),
                description: job.description ?? existing.description,
                skills: job.skills.length > 0 ? job.skills : existing.skills,
              },
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
                companyWebsite: job.companyWebsite,
                location: job.location,
                isRemote: job.isRemote,
                isHybrid: job.isHybrid,
                salaryMin: job.salaryMin,
                salaryMax: job.salaryMax,
                salaryCurrency: job.salaryCurrency,
                description: job.description,
                skills: job.skills,
                applyUrl: job.applyUrl,
                jobType: job.jobType,
                postedAt: job.postedAt,
                companyType: job.companyType,
                isActive: true,
              },
            })
            inserted++
          }
        } catch (e) {
          // Skip duplicate key errors silently
        }
      })
    )
  }

  // Mark old jobs inactive (not seen in last 30 days)
  await prisma.discoveredJob.updateMany({
    where: {
      updatedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      isActive: true,
    },
    data: { isActive: false },
  })

  console.log(`[JobFetcher] Done. Inserted: ${inserted}, Updated: ${updated}`)
  return { inserted, updated, total: jobs.length }
}
