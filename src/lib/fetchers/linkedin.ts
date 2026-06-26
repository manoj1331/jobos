// LinkedIn Jobs — public guest API (no auth, no key required)
import { NormalizedJob, isExcludedCompany, isStrictlyRelevant } from "./constants"

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

// India geolocation IDs for LinkedIn
const SEARCHES = [
  { role: "DevOps Engineer",        geoId: "102713980", label: "India" },
  { role: "Cloud Engineer",         geoId: "102713980", label: "India" },
  { role: "Platform Engineer",      geoId: "102713980", label: "India" },
  { role: "Cloud Support Engineer", geoId: "102713980", label: "India" },
  { role: "DevOps Engineer",        geoId: "105214831", label: "Bengaluru" },
  { role: "Cloud Engineer",         geoId: "105214831", label: "Bengaluru" },
  { role: "DevOps Engineer",        geoId: "105556870", label: "Hyderabad" },
  { role: "Cloud Engineer",         geoId: "105556870", label: "Hyderabad" },
  { role: "DevOps Engineer",        geoId: "106399894", label: "Chennai" },
  { role: "Platform Engineer",      geoId: "105556870", label: "Hyderabad" },
]

const INDIA_KEYWORDS = [
  "india", "bengaluru", "bangalore", "hyderabad", "chennai", "pune",
  "mumbai", "delhi", "noida", "gurgaon", "gurugram", "kochi",
  "trivandrum", "coimbatore", "mysore", "mysuru", "vizag",
  "visakhapatnam", "kolkata", "ahmedabad", "secunderabad",
]

function isIndiaLocation(loc: string): boolean {
  const l = loc.toLowerCase()
  return INDIA_KEYWORDS.some(k => l.includes(k)) || l === "remote"
}

function parseJobs(html: string) {
  const jobs: Array<{ id: string; title: string; company: string; location: string; url: string; postedAt?: Date }> = []

  const idMatches = [...html.matchAll(/data-entity-urn="urn:li:jobPosting:(\d+)"/g)]
  const titleMatches = [...html.matchAll(/class="base-search-card__title"[^>]*>\s*([\s\S]*?)\s*<\/h3>/g)]
  const companyMatches = [...html.matchAll(/class="base-search-card__subtitle"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/g)]
  const locMatches = [...html.matchAll(/class="job-search-card__location"[^>]*>\s*([\s\S]*?)\s*<\/span>/g)]
  const dateMatches = [...html.matchAll(/datetime="([^"]+)"/g)]

  for (let i = 0; i < idMatches.length; i++) {
    const id = idMatches[i][1]
    const title = (titleMatches[i]?.[1] ?? "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim()
    const company = (companyMatches[i]?.[1] ?? "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim()
    const location = (locMatches[i]?.[1] ?? "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim()
    const dateStr = dateMatches[i]?.[1]

    if (!title || !id) continue

    // Skip if company name looks wrong (LinkedIn sometimes puts title as company)
    if (!company || company.toLowerCase() === title.toLowerCase()) continue

    jobs.push({
      id,
      title,
      company,
      location,
      url: `https://www.linkedin.com/jobs/view/${id}/`,
      postedAt: dateStr ? new Date(dateStr) : undefined,
    })
  }
  return jobs
}

export async function fetchLinkedIn(): Promise<NormalizedJob[]> {
  const results: NormalizedJob[] = []
  const seen = new Set<string>()

  for (const { role, geoId, label } of SEARCHES) {
    for (let start = 0; start <= 40; start += 10) {
      try {
        const params = new URLSearchParams({
          keywords: role,
          geoId,
          f_E: "2,3",         // Associate + Mid-Senior level
          f_TPR: "r2592000",  // Last 30 days
          start: String(start),
        })

        const res = await fetch(
          `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${params}`,
          {
            headers: {
              "User-Agent": UA,
              "Accept": "text/html,application/xhtml+xml",
              "Accept-Language": "en-IN,en;q=0.9",
              "Referer": "https://www.linkedin.com/jobs/",
            },
            signal: AbortSignal.timeout(12000),
          }
        )

        if (!res.ok) break
        const html = await res.text()
        const jobs = parseJobs(html)
        if (!jobs.length) break

        for (const job of jobs) {
          if (seen.has(job.id)) continue
          if (!isStrictlyRelevant(job.title)) continue
          if (isExcludedCompany(job.company)) continue
          if (/\b(fresher|intern|trainee|0.?1\s*yr)\b/i.test(job.title)) continue

          // Enforce India location
          if (!isIndiaLocation(job.location)) continue

          seen.add(job.id)
          const loc = job.location
          const isRemote = loc.toLowerCase().includes("remote")
          const isHybrid = loc.toLowerCase().includes("hybrid")

          results.push({
            externalId: `li_${job.id}`,
            source: "linkedin",
            title: job.title,
            company: job.company,
            location: loc || `${label}, India`,
            isRemote,
            isHybrid,
            description: undefined,
            skills: [],
            applyUrl: job.url,
            jobType: "full-time",
            postedAt: job.postedAt,
          })
        }

        if (jobs.length < 10) break
        await new Promise(r => setTimeout(r, 400))
      } catch (e) {
        console.error(`[LinkedIn] ${role} ${label} start=${start}:`, (e as Error).message)
        break
      }
    }
  }

  console.log(`[LinkedIn] fetched ${results.length} India jobs`)
  return results
}
