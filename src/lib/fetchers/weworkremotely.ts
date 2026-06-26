import { NormalizedJob, isExcludedCompany, isRelevantRole } from "./constants"

const FEEDS = [
  "https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss",
  "https://weworkremotely.com/remote-jobs.rss",
]

function parseRSS(xml: string): NormalizedJob[] {
  const results: NormalizedJob[] = []
  const items = xml.split("<item>").slice(1)

  for (const item of items) {
    const get = (tag: string) => {
      const m = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`))
      return m ? (m[1] || m[2] || "").trim() : ""
    }

    const title = get("title")
    const company = get("author") || get("dc:creator") || ""
    const link = get("link") || get("guid")
    const desc = get("description")
    const pubDate = get("pubDate")
    const guid = get("guid")

    if (!title || !link) continue
    if (isExcludedCompany(company)) continue
    if (!isRelevantRole(title, desc)) continue

    results.push({
      externalId: `wwr_${Buffer.from(guid || link).toString("base64").slice(0, 20)}`,
      source: "weworkremotely",
      title,
      company: company || "Unknown",
      location: "Remote",
      isRemote: true,
      isHybrid: false,
      description: desc.replace(/<[^>]+>/g, "").trim(),
      skills: [],
      applyUrl: link,
      jobType: "full-time",
      postedAt: pubDate ? new Date(pubDate) : undefined,
    })
  }
  return results
}

export async function fetchWeWorkRemotely(): Promise<NormalizedJob[]> {
  const results: NormalizedJob[] = []

  for (const url of FEEDS) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "JobOS/1.0" },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) continue
      const xml = await res.text()
      results.push(...parseRSS(xml))
    } catch (e) {
      console.error("WWR fetch error:", e)
    }
  }
  return results
}
