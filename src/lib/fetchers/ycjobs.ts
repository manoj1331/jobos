import { NormalizedJob, isExcludedCompany, isRelevantRole } from "./constants"

// YC Work at a Startup - fetch via their public API
export async function fetchYCJobs(): Promise<NormalizedJob[]> {
  const results: NormalizedJob[] = []
  const roles = ["devops", "cloud", "infrastructure", "platform", "sre", "kubernetes"]

  for (const role of roles) {
    try {
      const res = await fetch(
        `https://www.workatastartup.com/jobs?q=${encodeURIComponent(role)}&remote=true&job_type=fulltime`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; JobOS/1.0)",
            "Accept": "application/json",
          },
          signal: AbortSignal.timeout(10000),
        }
      )
      // YC doesn't have a public JSON API, skip gracefully
    } catch {}
  }

  // Use Algolia search which YC uses publicly
  try {
    const query = "devops OR kubernetes OR cloud engineer OR SRE OR platform engineer OR infrastructure"
    const res = await fetch("https://45bwzj1sgc-dsn.algolia.net/1/indexes/WASJobs/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Algolia-Application-Id": "45BWZJ1SGC",
        "X-Algolia-API-Key": "Yjk5ZmNlODc4ZmVlNjczMzRhY2Q2YmFiMzQyNjVkNWM5Y2MwNDA0NjFmOGU5ZWE0ZWFiZThlODEzNmRjMjcxMHJlc3RyaWN0SW5kaWNlcz1XQVNKB2JzJmZpbHRlcnM9",
        "User-Agent": "JobOS/1.0",
      },
      body: JSON.stringify({
        query,
        hitsPerPage: 50,
        filters: "remote:true OR location:remote",
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (res.ok) {
      const data = await res.json()
      const hits = data.hits ?? []
      for (const hit of hits) {
        if (!hit.title || !hit.company?.name) continue
        if (isExcludedCompany(hit.company.name)) continue
        if (!isRelevantRole(hit.title)) continue

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
    }
  } catch (e) {
    console.error("YC Jobs fetch error:", e)
  }

  return results
}
