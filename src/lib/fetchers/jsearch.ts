import { NormalizedJob, isExcludedCompany, isStrictlyRelevant, isExperienceCompatible } from "./constants"

// Target exactly 4 roles — no more
const QUERIES = [
  "DevOps Engineer 3 years experience startup",
  "Cloud Engineer 3 years experience startup",
  "Platform Engineer 3 years experience startup",
  "Cloud Support Engineer 3 years experience",
]

export async function fetchJSearch(): Promise<NormalizedJob[]> {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) return []

  const results: NormalizedJob[] = []

  for (const query of QUERIES) {
    try {
      const url = new URL("https://jsearch.p.rapidapi.com/search")
      url.searchParams.set("query", query)
      url.searchParams.set("num_pages", "2")
      url.searchParams.set("date_posted", "month")

      const res = await fetch(url.toString(), {
        headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": "jsearch.p.rapidapi.com" },
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) continue
      const data = await res.json()

      for (const job of (data.data ?? [])) {
        if (!job.job_title || !job.employer_name) continue
        if (isExcludedCompany(job.employer_name)) continue
        if (!isStrictlyRelevant(job.job_title)) continue
        if (!isExperienceCompatible(job.(description|jobDescription|description)?.toString(), job.job_title)) continue
        if (!isExperienceCompatible(job.job_description, job.job_title)) continue

        const isRemote = job.job_is_remote === true
        const source = job.job_apply_link?.includes("linkedin") ? "linkedin"
          : job.job_apply_link?.includes("indeed") ? "indeed"
          : job.job_apply_link?.includes("glassdoor") ? "glassdoor"
          : "jsearch"

        results.push({
          externalId: `js_${job.job_id}`,
          source,
          title: job.job_title,
          company: job.employer_name,
          companyLogo: job.employer_logo,
          companyWebsite: job.employer_website,
          location: isRemote ? "Remote" : `${job.job_city ?? ""}${job.job_country ? ", " + job.job_country : ""}`.trim(),
          isRemote,
          isHybrid: job.job_employment_type?.toLowerCase().includes("hybrid") ?? false,
          description: job.job_description,
          skills: job.job_required_skills ?? [],
          applyUrl: job.job_apply_link,
          jobType: job.job_employment_type?.toLowerCase() || "full-time",
          salaryMin: job.job_min_salary ?? undefined,
          salaryMax: job.job_max_salary ?? undefined,
          salaryCurrency: job.job_salary_currency || "USD",
          postedAt: job.job_posted_at_datetime_utc ? new Date(job.job_posted_at_datetime_utc) : undefined,
        })
      }
      await new Promise(r => setTimeout(r, 500))
    } catch (e) {
      console.error(`[JSearch] error for "${query}":`, (e as Error).message)
    }
  }
  return results
}
