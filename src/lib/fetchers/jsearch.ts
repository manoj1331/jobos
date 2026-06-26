// JSearch (RapidAPI) — user must subscribe at rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
import { NormalizedJob, isExcludedCompany, isStrictlyRelevant } from "./constants"

export async function fetchJSearch(): Promise<NormalizedJob[]> {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) return []

  // Verify subscription first
  const test = await fetch("https://jsearch.p.rapidapi.com/search?query=test&num_pages=1", {
    headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": "jsearch.p.rapidapi.com" },
    signal: AbortSignal.timeout(8000),
  }).catch(() => null)

  if (!test?.ok) {
    const body = await test?.text().catch(() => "")
    if (body?.includes("not subscribed")) {
      console.log("[JSearch] Not subscribed — go to rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch and click Subscribe")
    }
    return []
  }

  const results: NormalizedJob[] = []
  const seen = new Set<string>()
  const queries = [
    "DevOps Engineer Bangalore India",
    "DevOps Engineer Hyderabad India",
    "DevOps Engineer Chennai India",
    "Cloud Engineer Bangalore India",
    "Cloud Engineer Hyderabad India",
    "Platform Engineer Bangalore India",
    "Cloud Support Engineer India",
  ]

  for (const query of queries) {
    try {
      const url = new URL("https://jsearch.p.rapidapi.com/search")
      url.searchParams.set("query", query)
      url.searchParams.set("num_pages", "2")
      url.searchParams.set("date_posted", "month")
      url.searchParams.set("country", "in")

      const res = await fetch(url.toString(), {
        headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": "jsearch.p.rapidapi.com" },
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) continue
      const data = await res.json()

      for (const job of (data.data ?? [])) {
        if (!job.job_id || seen.has(job.job_id)) continue
        if (!job.job_title || !job.employer_name) continue
        if (isExcludedCompany(job.employer_name)) continue
        if (!isStrictlyRelevant(job.job_title)) continue
        if (/\b8\+?\s*yr|10\s*yr/i.test(job.job_description ?? "")) continue

        const isRemote = job.job_is_remote === true
        const country = (job.job_country ?? "").toLowerCase()
        if (!isRemote && country && !["in", "india"].includes(country)) continue

        seen.add(job.job_id)
        const src = job.job_apply_link?.includes("linkedin") ? "linkedin"
          : job.job_apply_link?.includes("indeed") ? "indeed"
          : job.job_apply_link?.includes("glassdoor") ? "glassdoor"
          : "google"

        results.push({
          externalId: `js_${job.job_id}`,
          source: src,
          title: job.job_title,
          company: job.employer_name,
          companyLogo: job.employer_logo,
          location: isRemote ? "Remote, India" : `${job.job_city ?? ""}, India`.replace(/^,\s*/, ""),
          isRemote,
          isHybrid: false,
          description: (job.job_description ?? "").slice(0, 400),
          skills: job.job_required_skills ?? [],
          applyUrl: job.job_apply_link,
          jobType: "full-time",
          postedAt: job.job_posted_at_datetime_utc ? new Date(job.job_posted_at_datetime_utc) : undefined,
          salaryMin: job.job_min_salary ?? undefined,
          salaryMax: job.job_max_salary ?? undefined,
          salaryCurrency: "INR",
        })
      }
      await new Promise(r => setTimeout(r, 400))
    } catch (e) {
      console.error(`[JSearch] "${query}":`, (e as Error).message)
    }
  }

  console.log(`[JSearch] fetched ${results.length} jobs`)
  return results
}
