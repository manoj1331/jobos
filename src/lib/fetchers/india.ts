// India-specific job sources — RSS feeds and public APIs
import { NormalizedJob, isExcludedCompany, isStrictlyRelevant, isExperienceCompatible, isLocationCompatible } from "./constants"

const SOUTH_INDIA_LOCATIONS = ["bangalore","bengaluru","hyderabad","chennai","kochi","coimbatore","mysore","trivandrum","vizag","india"]

// Cutshort public job feed (no auth required)
export async function fetchCutshort(): Promise<NormalizedJob[]> {
  const results: NormalizedJob[] = []
  const roles = ["devops-engineer","cloud-engineer","platform-engineer"]

  for (const role of roles) {
    try {
      const res = await fetch(`https://cutshort.io/api/public/jobs?role=${role}&location=india`, {
        headers: { "User-Agent": "JobOS/1.0", "Accept": "application/json" },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) continue
      const data = await res.json()
      for (const job of (data.data ?? data.jobs ?? [])) {
        const title = job.title || job.name || ""
        const company = job.company?.name || job.companyName || ""
        if (!title || !company) continue
        if (isExcludedCompany(company)) continue
        if (!isStrictlyRelevant(title)) continue
        if (!isExperienceCompatible(job.description, title)) continue
        const loc = (job.location || job.city || "India").toLowerCase()
        if (!isLocationCompatible(loc)) continue

        results.push({
          externalId: `cs_${job.id || job._id}`,
          source: "cutshort",
          title,
          company,
          location: job.location || "India",
          isRemote: loc.includes("remote"),
          isHybrid: loc.includes("hybrid"),
          description: job.description,
          skills: job.skills?.map((s: any) => typeof s === "string" ? s : s.name) ?? [],
          applyUrl: `https://cutshort.io/job/${job.shortId || job.id}`,
          jobType: "full-time",
          postedAt: job.createdAt ? new Date(job.createdAt) : undefined,
          companyType: "startup",
        })
      }
    } catch (e) {
      console.error("[Cutshort]:", (e as Error).message)
    }
  }
  return results
}

// Wellfound (formerly AngelList) — public RSS
export async function fetchWellfound(): Promise<NormalizedJob[]> {
  const results: NormalizedJob[] = []
  const searches = [
    "devops+engineer+india",
    "cloud+engineer+india",
    "platform+engineer+india",
  ]

  for (const q of searches) {
    try {
      const res = await fetch(`https://wellfound.com/jobs?q=${q}&remote=true`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; JobOS/1.0)",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(10000),
      })
      // Wellfound requires auth for API, so this may not return JSON — skip gracefully
      if (!res.ok || !res.headers.get("content-type")?.includes("json")) continue
      const data = await res.json()
      for (const job of (data.jobs ?? [])) {
        if (!isStrictlyRelevant(job.title ?? "")) continue
        results.push({
          externalId: `wf_${job.id}`,
          source: "wellfound",
          title: job.title,
          company: job.startup?.name ?? job.company ?? "Unknown",
          location: job.location || "Remote",
          isRemote: job.remote === true,
          isHybrid: false,
          description: job.description,
          skills: [],
          applyUrl: `https://wellfound.com/jobs/${job.id}`,
          jobType: "full-time",
          postedAt: job.created_at ? new Date(job.created_at) : undefined,
          companyType: "startup",
        })
      }
    } catch {}
  }
  return results
}

// Instahyre public listings
export async function fetchInstahyre(): Promise<NormalizedJob[]> {
  const results: NormalizedJob[] = []
  const roles = ["devops-engineer","cloud-engineer","platform-engineer"]
  const cities = ["bangalore","hyderabad","chennai"]

  for (const role of roles) {
    for (const city of cities) {
      try {
        const res = await fetch(
          `https://www.instahyre.com/api/v1/opportunity/?designation=${encodeURIComponent(role.replace("-"," "))}&location=${city}&page=1`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; JobOS/1.0)",
              "Accept": "application/json",
            },
            signal: AbortSignal.timeout(8000),
          }
        )
        if (!res.ok) continue
        const data = await res.json()
        for (const job of (data.results ?? [])) {
          if (!job.designation || !job.employer?.name) continue
          if (isExcludedCompany(job.employer.name)) continue
          if (!isStrictlyRelevant(job.designation)) continue

          results.push({
            externalId: `ih_${job.id}`,
            source: "instahyre",
            title: job.designation,
            company: job.employer.name,
            companyLogo: job.employer.logo,
            location: city.charAt(0).toUpperCase() + city.slice(1) + ", India",
            isRemote: false,
            isHybrid: job.work_from_home === "H",
            description: job.description,
            skills: Array.isArray(job.skills) ? job.skills.map((s: any) => s.name ?? s) : [],
            applyUrl: `https://www.instahyre.com/jobs/${job.id}/`,
            jobType: "full-time",
            postedAt: job.created ? new Date(job.created) : undefined,
            companyType: "startup",
          })
        }
      } catch (e) {
        console.error(`[Instahyre] ${role}/${city}:`, (e as Error).message)
      }
    }
  }
  return results
}
