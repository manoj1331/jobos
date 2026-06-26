import { NormalizedJob, isExcludedCompany, isRelevantRole } from "./constants"

export async function fetchJobicy(): Promise<NormalizedJob[]> {
  const results: NormalizedJob[] = []
  const tags = ["devops", "cloud", "kubernetes", "sre", "infrastructure"]

  for (const tag of tags) {
    try {
      const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?count=50&tag=${tag}`, {
        headers: { "User-Agent": "JobOS/1.0" },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) continue
      const data = await res.json()
      const jobs = data.jobs ?? []

      for (const job of jobs) {
        if (!job.jobTitle || !job.companyName) continue
        if (isExcludedCompany(job.companyName)) continue
        if (!isRelevantRole(job.jobTitle, job.jobDescription)) continue

        results.push({
          externalId: `jcy_${job.id}`,
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
          applyUrl: job.jobGeo ? `${job.url}` : job.url,
          jobType: job.jobType || "full-time",
          postedAt: job.pubDate ? new Date(job.pubDate) : undefined,
        })
      }
    } catch (e) {
      console.error("Jobicy fetch error:", e)
    }
  }
  return results
}
