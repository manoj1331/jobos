import { NormalizedJob, isExcludedCompany, isRelevantRole } from "./constants"

export async function fetchArbeitnow(): Promise<NormalizedJob[]> {
  const results: NormalizedJob[] = []
  const tags = ["devops", "kubernetes", "cloud", "sre", "platform-engineering", "infrastructure"]

  for (const tag of tags) {
    try {
      const res = await fetch(`https://www.arbeitnow.com/api/job-board-api?tags[]=${tag}`, {
        headers: { "User-Agent": "JobOS/1.0" },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) continue
      const data = await res.json()
      const jobs = data.data ?? []

      for (const job of jobs) {
        if (!job.title || !job.company_name) continue
        if (isExcludedCompany(job.company_name)) continue
        if (!isRelevantRole(job.title, job.description)) continue

        const loc = job.location || "Remote"
        results.push({
          externalId: `arb_${job.slug}`,
          source: "arbeitnow",
          title: job.title,
          company: job.company_name,
          location: loc,
          isRemote: job.remote === true || loc.toLowerCase().includes("remote"),
          isHybrid: loc.toLowerCase().includes("hybrid"),
          description: job.description,
          skills: Array.isArray(job.tags) ? job.tags : [],
          applyUrl: job.url,
          jobType: job.job_types?.[0] || "full-time",
          postedAt: job.created_at ? new Date(job.created_at * 1000) : undefined,
        })
      }
    } catch (e) {
      console.error("Arbeitnow fetch error:", e)
    }
  }
  return results
}
