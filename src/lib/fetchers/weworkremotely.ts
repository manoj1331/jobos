import { NormalizedJob, isExcludedCompany, isStrictlyRelevant, isExperienceCompatible } from "./constants"

const FEEDS = ["https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss"]

function parseRSS(xml: string): NormalizedJob[] {
  const results: NormalizedJob[] = []
  for (const item of xml.split("<item>").slice(1)) {
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
    if (!isStrictlyRelevant(title)) continue
    if (!isExperienceCompatible(desc, title)) continue
    // WWR = worldwide remote → compatible with South India
    results.push({
      externalId: `wwr_${Buffer.from(guid || link).toString("base64").slice(0, 20)}`,
      source: "weworkremotely",
      title, company: company || "Unknown",
      location: "Remote", isRemote: true, isHybrid: false,
      description: desc.replace(/<[^>]+>/g, "").trim(),
      skills: [], applyUrl: link, jobType: "full-time",
      postedAt: pubDate ? new Date(pubDate) : undefined,
    })
  }
  return results
}

export async function fetchWeWorkRemotely(): Promise<NormalizedJob[]> {
  const results: NormalizedJob[] = []
  for (const url of FEEDS) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "JobOS/1.0" }, signal: AbortSignal.timeout(10000) })
      if (!res.ok) continue
      results.push(...parseRSS(await res.text()))
    } catch (e) { console.error("[WWR]:", (e as Error).message) }
  }
  return results
}
