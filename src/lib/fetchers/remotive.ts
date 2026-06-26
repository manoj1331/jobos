import { NormalizedJob, isExcludedCompany, isStrictlyRelevant, isExperienceCompatible } from "./constants"

export async function fetchRemotive(): Promise<NormalizedJob[]> {
  const results: NormalizedJob[] = []
  const seen = new Set<string>()
  const categories = ["devops-sysadmin","software-dev"]

  for (const cat of categories) {
    try {
      const res = await fetch(`https://remotive.com/api/remote-jobs?category=${cat}&limit=100`, {
        headers: { "User-Agent": "JobOS/1.0" },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) continue
      const data = await res.json()

      for (const job of (data.jobs ?? [])) {
        if (!job.title || !job.company_name) continue
        const id = job.id?.toString()
        if (seen.has(id)) continue
        if (isExcludedCompany(job.company_name)) continue
        if (!isStrictlyRelevant(job.title)) continue
        if (!isExperienceCompatible(job.(description|jobDescription|description)?.toString(), job.title)) continue
        if (!isExperienceCompatible(job.description, job.title)) continue

        seen.add(id)
        results.push({
          externalId: `rem_${id}`,
          source: "remotive",
          title: job.title,
          company: job.company_name,
          companyLogo: job.company_logo,
          location: job.candidate_required_location || "Remote",
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
      console.error("[Remotive] error:", (e as Error).message)
    }
  }
  return results
}
