// Naukri India — RSS feed (public, no auth needed)
import { NormalizedJob, isExcludedCompany, isStrictlyRelevant } from "./constants"

const RSS_FEEDS = [
  { url: "https://www.naukri.com/rss/devops-engineer-jobs-in-india-3-to-6-years", role: "DevOps Engineer" },
  { url: "https://www.naukri.com/rss/cloud-engineer-jobs-in-india-3-to-6-years", role: "Cloud Engineer" },
  { url: "https://www.naukri.com/rss/platform-engineer-jobs-in-india-2-to-5-years", role: "Platform Engineer" },
  { url: "https://www.naukri.com/rss/cloud-support-engineer-jobs-in-india", role: "Cloud Support Engineer" },
  { url: "https://www.naukri.com/rss/devops-engineer-jobs-in-bangalore", role: "DevOps Engineer Bangalore" },
  { url: "https://www.naukri.com/rss/cloud-engineer-jobs-in-bangalore", role: "Cloud Engineer Bangalore" },
  { url: "https://www.naukri.com/rss/devops-engineer-jobs-in-hyderabad", role: "DevOps Engineer Hyderabad" },
  { url: "https://www.naukri.com/rss/cloud-engineer-jobs-in-hyderabad", role: "Cloud Engineer Hyderabad" },
  { url: "https://www.naukri.com/rss/devops-engineer-jobs-in-chennai", role: "DevOps Engineer Chennai" },
]

function parseNaukriRSS(xml: string): Array<{ title: string; company: string; location: string; link: string; desc: string; pubDate?: Date }> {
  const jobs: any[] = []
  const items = xml.split("<item>").slice(1)

  for (const item of items) {
    const get = (tag: string) => {
      const m = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`))
      return (m ? (m[1] || m[2] || "") : "").trim()
    }
    const title = get("title")
    const link = get("link") || get("guid")
    const desc = get("description")
    const pubDate = get("pubDate")

    // Naukri RSS has company/location in the description
    const companyMatch = desc.match(/Company[:\s]+([^<\n]+)/i) || desc.match(/<strong>([^<]+)<\/strong>/i)
    const locationMatch = desc.match(/Location[:\s]+([^<\n]+)/i) || desc.match(/Location\s*:\s*([^\n<]+)/i)

    if (!title || !link) continue

    jobs.push({
      title: title.replace(/\s*-\s*Naukri.*$/, "").trim(),
      company: companyMatch?.[1]?.trim() ?? "Unknown",
      location: locationMatch?.[1]?.trim() ?? "India",
      link,
      desc: desc.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 400),
      pubDate: pubDate ? new Date(pubDate) : undefined,
    })
  }
  return jobs
}

export async function fetchNaukri(): Promise<NormalizedJob[]> {
  const results: NormalizedJob[] = []
  const seen = new Set<string>()

  for (const { url } of RSS_FEEDS) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; RSS/1.0)",
          "Accept": "application/rss+xml, application/xml, text/xml, */*",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(12000),
      })

      if (!res.ok) continue
      const xml = await res.text()

      // Not XML (got HTML redirect)
      if (!xml.includes("<item>")) continue

      const jobs = parseNaukriRSS(xml)
      for (const job of jobs) {
        if (seen.has(job.link)) continue
        if (isExcludedCompany(job.company)) continue
        if (!isStrictlyRelevant(job.title)) continue
        if (/\b(fresher|0.?1\s*yr)\b/i.test(job.title)) continue

        seen.add(job.link)
        const loc = job.location
        results.push({
          externalId: `naukri_${Buffer.from(job.link).toString("base64").slice(0, 24)}`,
          source: "naukri",
          title: job.title,
          company: job.company,
          location: loc || "India",
          isRemote: loc.toLowerCase().includes("remote"),
          isHybrid: loc.toLowerCase().includes("hybrid"),
          description: job.desc,
          skills: [],
          applyUrl: job.link,
          jobType: "full-time",
          postedAt: job.pubDate,
        })
      }
    } catch (e) {
      console.error(`[Naukri] ${url}:`, (e as Error).message)
    }
  }

  console.log(`[Naukri] fetched ${results.length} jobs`)
  return results
}
