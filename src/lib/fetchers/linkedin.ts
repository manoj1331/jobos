// LinkedIn Jobs — public guest API (no key required)
import { NormalizedJob, isExcludedCompany, isStrictlyRelevant } from "./constants"

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

const SEARCHES = [
  { role: "DevOps Engineer", location: "India", geoId: "102713980" },
  { role: "Cloud Engineer", location: "India", geoId: "102713980" },
  { role: "Platform Engineer", location: "India", geoId: "102713980" },
  { role: "Cloud Support Engineer", location: "India", geoId: "102713980" },
  { role: "DevOps Engineer", location: "Bengaluru, Karnataka, India", geoId: "105214831" },
  { role: "Cloud Engineer", location: "Bengaluru, Karnataka, India", geoId: "105214831" },
  { role: "DevOps Engineer", location: "Hyderabad, Telangana, India", geoId: "105556870" },
  { role: "Cloud Engineer", location: "Hyderabad, Telangana, India", geoId: "105556870" },
  { role: "DevOps Engineer", location: "Chennai, Tamil Nadu, India", geoId: "106399894" },
]

function parseJobs(html: string, source = "linkedin"): Array<{ id: string; title: string; company: string; location: string; url: string; postedAt?: Date }> {
  const jobs: any[] = []
  // Extract job IDs
  const idMatches = [...html.matchAll(/data-entity-urn="urn:li:jobPosting:(\d+)"/g)]

  // Extract titles
  const titleMatches = [...html.matchAll(/class="base-search-card__title"[^>]*>\s*([\s\S]*?)\s*<\/h3>/g)]

  // Extract companies
  const companyMatches = [...html.matchAll(/class="base-search-card__subtitle"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/g)]

  // Extract locations
  const locMatches = [...html.matchAll(/class="job-search-card__location"[^>]*>\s*([\s\S]*?)\s*<\/span>/g)]

  // Extract posted dates
  const dateMatches = [...html.matchAll(/datetime="([^"]+)"/g)]

  for (let i = 0; i < idMatches.length; i++) {
    const id = idMatches[i][1]
    const title = (titleMatches[i]?.[1] ?? "").replace(/<[^>]+>/g, "").trim()
    const company = (companyMatches[i]?.[1] ?? "").replace(/<[^>]+>/g, "").trim()
    const location = (locMatches[i]?.[1] ?? "").replace(/<[^>]+>/g, "").trim()
    const dateStr = dateMatches[i]?.[1]

    if (!title || !id) continue
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

  for (const { role, location, geoId } of SEARCHES) {
    for (let start = 0; start <= 20; start += 10) {
      try {
        const params = new URLSearchParams({
          keywords: role,
          location,
          geoId,
          f_E: "2,3",          // Mid-Senior + Associate level (3-4 yrs)
          f_TPR: "r2592000",   // Posted in last 30 days
          f_WT: "1,2,3",       // On-site, Remote, Hybrid
          start: String(start),
        })

        const res = await fetch(
          `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${params}`,
          {
            headers: {
              "User-Agent": UA,
              "Accept": "text/html,application/xhtml+xml",
              "Accept-Language": "en-US,en;q=0.9",
              "Referer": "https://www.linkedin.com/jobs/",
            },
            signal: AbortSignal.timeout(12000),
          }
        )

        if (!res.ok) break
        const html = await res.text()
        const jobs = parseJobs(html)

        for (const job of jobs) {
          if (seen.has(job.id)) continue
          if (!job.title) continue
          if (isExcludedCompany(job.company)) continue
          if (!isStrictlyRelevant(job.title)) continue

          // Skip if title has fresher/0-1 yr signals
          if (/\b(fresher|0.?1\s*yr|junior|intern)\b/i.test(job.title)) continue

          seen.add(job.id)

          const loc = job.location
          const isRemote = loc.toLowerCase().includes("remote")
          const isHybrid = loc.toLowerCase().includes("hybrid")

          results.push({
            externalId: `li_${job.id}`,
            source: "linkedin",
            title: job.title,
            company: job.company || "Unknown",
            location: loc || "India",
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
        await new Promise(r => setTimeout(r, 500))
      } catch (e) {
        console.error(`[LinkedIn] ${role} ${location} start=${start}:`, (e as Error).message)
        break
      }
    }
  }

  console.log(`[LinkedIn] fetched ${results.length} jobs`)
  return results
}
