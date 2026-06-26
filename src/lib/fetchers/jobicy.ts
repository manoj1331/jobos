import { NormalizedJob, isExcludedCompany, isStrictlyRelevant, isExperienceCompatible } from "./constants"

const TAGS = ["devops","cloud","platform","kubernetes","infrastructure","sre"]

export async function fetchJobicy(): Promise<NormalizedJob[]> {
  const results: NormalizedJob[] = []
  const seen = new Set<string>()

  for (const tag of TAGS) {
    try {
      const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?count=50&tag=${tag}`, {
        headers: { "User-Agent": "JobOS/1.0" },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) continue
      const data = await res.json()

      for (const job of (data.jobs ?? [])) {
        if (!job.jobTitle || !job.companyName) continue
        const id = job.id?.toString()
        if (seen.has(id)) continue
        if (isExcludedCompany(job.companyName)) continue
        if (!isStrictlyRelevant(job.jobTitle)) continue
        if (!isExperienceCompatible(job.(description|jobDescription|description)?.toString(), job.jobTitle)) continue
        if (!isExperienceCompatible(job.jobDescription, job.jobTitle)) continue

        seen.add(id)
        results.push({
          externalId: `jcy_${id}`,
          source: "jobicy",
          title: job.jobTitle,
          company: job.companyName,
          companyLogo: job.companyLogo,
          companyWebsite: job.companyUrl,
          location: "Remote",
          isRemote: true,
          isHybrid: false,
          description: job.jobDescription,
          skills: Array.isArray(job.jobIndustry) ? job.jobIndustry : [],
          applyUrl: job.url,
          jobType: job.jobType || "full-time",
          postedAt: job.pubDate ? new Date(job.pubDate) : undefined,
        })
      }
    } catch (e) {
      console.error("[Jobicy] error:", (e as Error).message)
    }
  }
  return results
}
