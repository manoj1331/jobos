// Wellfound (AngelList) — startup jobs in India
import { NormalizedJob, isExcludedCompany, isStrictlyRelevant } from "./constants"

export async function fetchWellfound(): Promise<NormalizedJob[]> {
  const results: NormalizedJob[] = []
  const roles = ["devops-engineer", "cloud-engineer", "platform-engineer"]

  for (const role of roles) {
    try {
      // Wellfound uses Algolia internally — try their public search
      const res = await fetch(
        `https://wellfound.com/role/l/${role}/india`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json, text/html",
          },
          signal: AbortSignal.timeout(10000),
        }
      )
      if (!res.ok) continue

      const text = await res.text()

      // Extract JSON-LD or window.__NEXT_DATA__
      const nextDataMatch = text.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/)
      if (!nextDataMatch) continue

      const nextData = JSON.parse(nextDataMatch[1])
      const jobs = nextData?.props?.pageProps?.jobs ?? nextData?.props?.pageProps?.jobListings ?? []

      for (const job of jobs) {
        const id = job.id?.toString() ?? job.hashId
        if (!id) continue
        const company = job.startup?.name ?? job.company?.name ?? ""
        if (!company || isExcludedCompany(company)) continue
        if (!isStrictlyRelevant(job.title ?? "")) continue

        results.push({
          externalId: `wf_${id}`,
          source: "wellfound",
          title: job.title,
          company,
          companyLogo: job.startup?.logoUrl ?? job.company?.logoUrl,
          location: job.locationNames?.[0] ?? job.remote ? "Remote" : "India",
          isRemote: job.remote === true,
          isHybrid: false,
          description: (job.description ?? "").slice(0, 500),
          skills: job.skills?.map((s: any) => typeof s === "string" ? s : s.name) ?? [],
          applyUrl: `https://wellfound.com/jobs/${id}`,
          jobType: "full-time",
          postedAt: job.liveStartAt ? new Date(job.liveStartAt) : undefined,
          companyType: "startup",
        })
      }
    } catch (e) {
      console.error(`[Wellfound] ${role}:`, (e as Error).message)
    }
  }

  console.log(`[Wellfound] fetched ${results.length} jobs`)
  return results
}
