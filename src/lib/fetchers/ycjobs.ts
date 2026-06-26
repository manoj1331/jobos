import { NormalizedJob, isExcludedCompany, isStrictlyRelevant, isExperienceCompatible } from "./constants"

export async function fetchYCJobs(): Promise<NormalizedJob[]> {
  const results: NormalizedJob[] = []
  const roles = ["devops engineer","cloud engineer","platform engineer","cloud support"]

  for (const role of roles) {
    try {
      const res = await fetch("https://45bwzj1sgc-dsn.algolia.net/1/indexes/WASJobs/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Algolia-Application-Id": "45BWZJ1SGC",
          "X-Algolia-API-Key": "Yjk5ZmNlODc4ZmVlNjczMzRhY2Q2YmFiMzQyNjVkNWM5Y2MwNDA0NjFmOGU5ZWE0ZWFiZThlODEzNmRjMjcxMHJlc3RyaWN0SW5kaWNlcz1XQVNKB2JzJmZpbHRlcnM9",
        },
        body: JSON.stringify({ query: role, hitsPerPage: 30 }),
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) continue
      const data = await res.json()
      for (const hit of (data.hits ?? [])) {
        if (!hit.title || !hit.company?.name) continue
        if (isExcludedCompany(hit.company.name)) continue
        if (!isStrictlyRelevant(hit.title)) continue
        if (!isExperienceCompatible(job.(description|jobDescription|description)?.toString(), hit.title)) continue
        if (!isExperienceCompatible(hit.description, hit.title)) continue
        results.push({
          externalId: `yc_${hit.objectID}`,
          source: "ycombinator",
          title: hit.title,
          company: hit.company.name,
          companyLogo: hit.company.smallLogoUrl,
          companyWebsite: hit.company.url,
          location: hit.location || "Remote",
          isRemote: hit.remote === true,
          isHybrid: false,
          description: hit.description,
          skills: hit.skills ?? [],
          applyUrl: `https://www.workatastartup.com/jobs/${hit.objectID}`,
          jobType: "full-time",
          postedAt: hit.created_at ? new Date(hit.created_at) : undefined,
          companyType: "startup",
        })
      }
    } catch (e) {
      console.error("[YCJobs] error:", (e as Error).message)
    }
  }
  return results
}
