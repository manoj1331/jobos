// JSearch via RapidAPI — aggregates LinkedIn, Indeed, Glassdoor, Google Jobs
// Set RAPIDAPI_KEY in docker-compose.yml to activate
import { NormalizedJob, isExcludedCompany, isStrictlyRelevant } from "./constants"

const QUERIES = [
  "DevOps Engineer Bangalore India 3 years",
  "DevOps Engineer Hyderabad India 3 years",
  "DevOps Engineer Chennai India",
  "Cloud Engineer Bangalore India",
  "Cloud Engineer Hyderabad India",
  "Platform Engineer Bangalore India",
  "Cloud Support Engineer India",
]

export async function fetchJSearch(): Promise<NormalizedJob[]> {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) {
    console.log("[JSearch] No RAPIDAPI_KEY set — skipping LinkedIn/Indeed/Glassdoor/Google Jobs")
    return []
  }

  const results: NormalizedJob[] = []
  const seen = new Set<string>()

  for (const query of QUERIES) {
    try {
      const url = new URL("https://jsearch.p.rapidapi.com/search")
      url.searchParams.set("query", query)
      url.searchParams.set("num_pages", "2")
      url.searchParams.set("date_posted", "month")
      url.searchParams.set("country", "in")

      const res = await fetch(url.toString(), {
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        },
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) continue
      const data = await res.json()

      for (const job of (data.data ?? [])) {
        const id = job.job_id
        if (!id || seen.has(id)) continue
        if (!job.job_title || !job.employer_name) continue
        if (isExcludedCompany(job.employer_name)) continue
        if (!isStrictlyRelevant(job.job_title)) continue

        // Experience: skip if clearly 8+ years
        const desc = (job.job_description ?? "").toLowerCase()
        if (/\b(8|9|10|12|15)\+?\s*year/.test(desc)) continue

        // Location: India only
        const country = (job.job_country ?? "").toLowerCase()
        const city = (job.job_city ?? "").toLowerCase()
        const isRemote = job.job_is_remote === true
        if (!isRemote && country && country !== "in" && country !== "india") continue

        seen.add(id)

        const src = job.job_apply_link?.includes("linkedin") ? "linkedin"
          : job.job_apply_link?.includes("indeed") ? "indeed"
          : job.job_apply_link?.includes("glassdoor") ? "glassdoor"
          : "google"

        results.push({
          externalId: `js_${id}`,
          source: src,
          title: job.job_title,
          company: job.employer_name,
          companyLogo: job.employer_logo,
          location: isRemote ? "Remote" : `${job.job_city ?? ""}${job.job_state_short ? ", " + job.job_state_short : ""}, India`.replace(/^,\s*/, ""),
          isRemote,
          isHybrid: job.job_employment_type?.toLowerCase().includes("hybrid") ?? false,
          description: (job.job_description ?? "").slice(0, 500),
          skills: job.job_required_skills ?? [],
          applyUrl: job.job_apply_link,
          jobType: job.job_employment_type?.toLowerCase() || "full-time",
          postedAt: job.job_posted_at_datetime_utc ? new Date(job.job_posted_at_datetime_utc) : undefined,
          salaryMin: job.job_min_salary ?? undefined,
          salaryMax: job.job_max_salary ?? undefined,
          salaryCurrency: "INR",
        })
      }
      await new Promise(r => setTimeout(r, 300))
    } catch (e) {
      console.error(`[JSearch] "${query}":`, (e as Error).message)
    }
  }

  console.log(`[JSearch] fetched ${results.length} jobs`)
  return results
}
