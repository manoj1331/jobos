import { NormalizedJob, isExcludedCompany, isStrictlyRelevant, isExperienceCompatible } from "./constants"

const TAGS = ["devops","cloud","platform-engineer","cloud-engineer","infrastructure","kubernetes","sre","devsecops","terraform","aws","gcp","azure"]

export async function fetchRemoteOK(): Promise<NormalizedJob[]> {
  const results: NormalizedJob[] = []
  const seen = new Set<string>()

  for (const tag of TAGS) {
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
        const id = job.id?.toString()
        if (seen.has(id)) continue
        if (isExcludedCompany(job.company)) continue
        if (!isStrictlyRelevant(job.position)) continue
        if (!isExperienceCompatible(job.(description|jobDescription|description)?.toString(), job.position)) continue
        if (!isExperienceCompatible(job.description, job.position)) continue

        seen.add(id)
        results.push({
          externalId: `rok_${id}`,
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
          companyType: "startup",
        })
      }
    } catch (e) {
      console.error(`[RemoteOK] tag=${tag} error:`, (e as Error).message)
    }
  }
  return results
}
