import { NormalizedJob, isExcludedCompany, isRelevantRole } from "./constants"

const CATEGORIES = ["devops-sysadmin", "software-dev"]
const KEYWORDS = ["devops","kubernetes","k8s","cloud","sre","infrastructure","platform","terraform","ansible"]

export async function fetchRemotive(): Promise<NormalizedJob[]> {
  const results: NormalizedJob[] = []
  const seen = new Set<string>()

  for (const cat of CATEGORIES) {
    try {
      const res = await fetch(`https://remotive.com/api/remote-jobs?category=${cat}&limit=100`, {
        headers: { "User-Agent": "JobOS/1.0" },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) continue
      const data = await res.json()
      const jobs = data.jobs ?? []

      for (const job of jobs) {
        if (!job.title || !job.company_name) continue
        if (seen.has(job.id?.toString())) continue
        if (isExcludedCompany(job.company_name)) continue
        if (!isRelevantRole(job.title, job.description)) continue

        const skills = Array.isArray(job.tags) ? job.tags.filter(Boolean) : []
        seen.add(job.id?.toString())

        results.push({
          externalId: `rem_${job.id}`,
          source: "remotive",
          title: job.title,
          company: job.company_name,
          companyLogo: job.company_logo,
          location: job.candidate_required_location || "Remote",
          isRemote: true,
          isHybrid: false,
          description: job.description,
          skills,
          applyUrl: job.url,
          jobType: job.job_type || "full-time",
          postedAt: job.publication_date ? new Date(job.publication_date) : undefined,
          companyType: "startup",
        })
      }
    } catch (e) {
      console.error("Remotive fetch error:", e)
    }
  }
  return results
}
