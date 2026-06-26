import { NormalizedJob, isExcludedCompany, isStrictlyRelevant, isExperienceCompatible } from "./constants"

export async function fetchRemotive(): Promise<NormalizedJob[]> {
  const results: NormalizedJob[] = []
  const seen = new Set<string>()

  try {
    const res = await fetch("https://remotive.com/api/remote-jobs?category=devops-sysadmin&limit=100", {
      headers: { "User-Agent": "JobOS/1.0" },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return []
    const data = await res.json()
    for (const job of (data.jobs ?? [])) {
      if (!job.title || !job.company_name) continue
      const id = job.id?.toString()
      if (seen.has(id)) continue
      if (isExcludedCompany(job.company_name)) continue
      if (!isStrictlyRelevant(job.title)) continue
      if (!isExperienceCompatible(job.description, job.title)) continue
      seen.add(id)
      // Remotive = fully remote → South India compatible
      results.push({
        externalId: `rem_${id}`,
        source: "remotive",
        title: job.title,
        company: job.company_name,
        companyLogo: job.company_logo,
        location: "Remote",
        isRemote: true,
        isHybrid: false,
        description: job.description,
        skills: Array.isArray(job.tags) ? job.tags : [],
        applyUrl: job.url,
        jobType: job.job_type || "full-time",
        postedAt: job.publication_date ? new Date(job.publication_date) : undefined,
      })
    }
  } catch (e) {
    console.error("[Remotive]:", (e as Error).message)
  }
  return results
}
