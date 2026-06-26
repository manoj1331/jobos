// JSearch via RapidAPI — aggregates LinkedIn, Indeed, Glassdoor, Naukri
// Requires RAPIDAPI_KEY env var
import { NormalizedJob, isExcludedCompany, isRelevantRole } from "./constants"

const QUERIES = [
  "DevOps Engineer",
  "Cloud Engineer",
  "Platform Engineer",
  "Site Reliability Engineer",
  "Infrastructure Engineer",
  "Kubernetes Engineer",
  "Cloud Support Engineer",
]

export async function fetchJSearch(): Promise<NormalizedJob[]> {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) return []

  const results: NormalizedJob[] = []

  for (const query of QUERIES) {
    try {
      const url = new URL("https://jsearch.p.rapidapi.com/search")
      url.searchParams.set("query", `${query} startup product company`)
      url.searchParams.set("num_pages", "3")
      url.searchParams.set("date_posted", "month")

      const res = await fetch(url.toString(), {
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        },
        signal: AbortSignal.timeout(15000),
      })

      if (!res.ok) continue
      const data = await res.json()
      const jobs = data.data ?? []

      for (const job of jobs) {
        if (!job.job_title || !job.employer_name) continue
        if (isExcludedCompany(job.employer_name)) continue
        if (!isRelevantRole(job.job_title, job.job_description)) continue

        const sal = job.job_salary_currency || "USD"
        const isRemote = job.job_is_remote === true
        const isHybrid = job.job_employment_type?.toLowerCase().includes("hybrid")

        results.push({
          externalId: `js_${job.job_id}`,
          source: job.job_apply_link?.includes("linkedin") ? "linkedin" :
                  job.job_apply_link?.includes("indeed") ? "indeed" :
                  job.job_apply_link?.includes("glassdoor") ? "glassdoor" : "jsearch",
          title: job.job_title,
          company: job.employer_name,
          companyLogo: job.employer_logo,
          companyWebsite: job.employer_website,
          location: isRemote ? "Remote" : `${job.job_city || ""}${job.job_country ? ", " + job.job_country : ""}`.trim(),
          isRemote,
          isHybrid: isHybrid ?? false,
          description: job.job_description,
          skills: job.job_required_skills ?? [],
          applyUrl: job.job_apply_link,
          jobType: job.job_employment_type?.toLowerCase() || "full-time",
          salaryMin: job.job_min_salary ?? undefined,
          salaryMax: job.job_max_salary ?? undefined,
          salaryCurrency: sal,
          postedAt: job.job_posted_at_datetime_utc ? new Date(job.job_posted_at_datetime_utc) : undefined,
        })
      }
      // Rate limit
      await new Promise(r => setTimeout(r, 500))
    } catch (e) {
      console.error(`JSearch error for "${query}":`, e)
    }
  }

  return results
}
