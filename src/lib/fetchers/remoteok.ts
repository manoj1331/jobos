import { NormalizedJob, isExcludedCompany, isRelevantRole } from "./constants"

export async function fetchRemoteOK(): Promise<NormalizedJob[]> {
  const tags = ["devops", "kubernetes", "cloud", "sre", "infrastructure", "platform"]
  const results: NormalizedJob[] = []
  const seen = new Set<string>()

  for (const tag of tags) {
    try {
      const res = await fetch(`https://remoteok.com/api?tag=${tag}`, {
        headers: { "User-Agent": "Mozilla/5.0 JobOS/1.0" },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) continue
      const data = await res.json()
      const jobs = Array.isArray(data) ? data.slice(1) : []

      for (const job of jobs) {
        if (!job.position || !job.company) continue
        if (seen.has(job.id?.toString())) continue
        if (isExcludedCompany(job.company)) continue
        if (!isRelevantRole(job.position, job.description)) continue

        seen.add(job.id?.toString())
        results.push({
          externalId: `rok_${job.id}`,
          source: "remoteok",
          title: job.position,
          company: job.company,
          companyLogo: job.company_logo,
          location: "Remote",
          isRemote: true,
          isHybrid: false,
          description: job.description,
          skills: Array.isArray(job.tags) ? job.tags : [],
          applyUrl: job.url || `https://remoteok.com/remote-jobs/${job.slug}`,
          jobType: "full-time",
          postedAt: job.date ? new Date(job.date) : undefined,
        })
      }
    } catch (e) {
      console.error(`RemoteOK fetch error for tag ${tag}:`, e)
    }
  }
  return results
}
