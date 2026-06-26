import { NormalizedJob, isExcludedCompany, isStrictlyRelevant, isExperienceCompatible } from "./constants"

const TAGS = ["devops","cloud-engineer","platform-engineer","cloud","kubernetes","aws","gcp","azure","terraform","infrastructure"]

export async function fetchArbeitnow(): Promise<NormalizedJob[]> {
  const results: NormalizedJob[] = []
  const seen = new Set<string>()

  for (const tag of TAGS) {
    try {
      const res = await fetch(`https://www.arbeitnow.com/api/job-board-api?tags[]=${tag}`, {
        headers: { "User-Agent": "JobOS/1.0" },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) continue
      const data = await res.json()

      for (const job of (data.data ?? [])) {
        if (!job.title || !job.company_name) continue
        if (seen.has(job.slug)) continue
        if (isExcludedCompany(job.company_name)) continue
        if (!isStrictlyRelevant(job.title)) continue
        if (!isExperienceCompatible(job.(description|jobDescription|description)?.toString(), job.title)) continue
        if (!isExperienceCompatible(job.description, job.title)) continue

        seen.add(job.slug)
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
      console.error("[Arbeitnow] error:", (e as Error).message)
    }
  }
  return results
}
