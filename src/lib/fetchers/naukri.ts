// Naukri India — uses their internal frontend API (no auth required)
import { NormalizedJob, isExcludedCompany, isStrictlyRelevant } from "./constants"

const ROLES = [
  { keyword: "devops engineer", key: "devops-engineer-jobs-in-india" },
  { keyword: "cloud engineer", key: "cloud-engineer-jobs-in-india" },
  { keyword: "platform engineer", key: "platform-engineer-jobs-in-india" },
  { keyword: "cloud support engineer", key: "cloud-support-engineer-jobs-in-india" },
]

function parseExp(minExp?: number, maxExp?: number): string | undefined {
  if (minExp === undefined && maxExp === undefined) return undefined
  if (minExp !== undefined && maxExp !== undefined) return `${minExp}–${maxExp} yrs`
  if (minExp !== undefined) return `${minExp}+ yrs`
  return `Up to ${maxExp} yrs`
}

export async function fetchNaukri(): Promise<NormalizedJob[]> {
  const results: NormalizedJob[] = []
  const seen = new Set<string>()

  for (const role of ROLES) {
    for (let page = 1; page <= 3; page++) {
      try {
        const url = new URL("https://www.naukri.com/jobapi/v3/search")
        url.searchParams.set("noOfResults", "20")
        url.searchParams.set("urlType", "search_by_key_loc")
        url.searchParams.set("searchType", "adv")
        url.searchParams.set("keyword", role.keyword)
        url.searchParams.set("location", "india")
        url.searchParams.set("experience", "3")
        url.searchParams.set("pageNo", String(page))
        url.searchParams.set("k", role.keyword)
        url.searchParams.set("l", "india")
        url.searchParams.set("seoKey", role.key)
        url.searchParams.set("src", "jobsearchDesk")

        const res = await fetch(url.toString(), {
          headers: {
            "Appid": "109",
            "systemid": "109",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
            "Referer": "https://www.naukri.com/",
          },
          signal: AbortSignal.timeout(12000),
        })

        if (!res.ok) break
        const data = await res.json()
        const jobs = data.jobDetails ?? []
        if (!jobs.length) break

        for (const job of jobs) {
          const id = job.jobId?.toString()
          if (!id || seen.has(id)) continue
          if (isExcludedCompany(job.companyName ?? "")) continue
          if (!isStrictlyRelevant(job.title ?? "")) continue

          // Experience filter: only 2–6 years
          const minExp = job.minimumExperience
          const maxExp = job.maximumExperience
          if (minExp !== undefined && minExp > 6) continue
          if (maxExp !== undefined && maxExp < 2) continue

          seen.add(id)

          const loc = Array.isArray(job.placeholders)
            ? job.placeholders.find((p: any) => p.type === "location")?.label ?? "India"
            : "India"

          const isRemote = loc.toLowerCase().includes("remote") || loc.toLowerCase().includes("work from home")
          const isHybrid = loc.toLowerCase().includes("hybrid")

          results.push({
            externalId: `naukri_${id}`,
            source: "naukri",
            title: job.title,
            company: job.companyName ?? "Unknown",
            companyLogo: job.logoPathV3 ?? job.ambitionBoxData?.companyAvatar,
            location: loc,
            isRemote,
            isHybrid,
            description: job.jobDescription ?? job.staticUrl,
            skills: Array.isArray(job.tagsAndSkills)
              ? job.tagsAndSkills.split(",").map((s: string) => s.trim()).filter(Boolean)
              : [],
            applyUrl: `https://www.naukri.com${job.jdURL ?? `/job-listings-${id}`}`,
            jobType: "full-time",
            postedAt: job.footerPlaceholderLabel ? undefined : undefined,
            companyType: undefined,
            salaryMin: job.salary ? undefined : undefined,
            experienceMin: minExp,
            experienceMax: maxExp,
          })
        }
      } catch (e) {
        console.error(`[Naukri] ${role.keyword} p${page}:`, (e as Error).message)
        break
      }
    }
  }

  console.log(`[Naukri] fetched ${results.length} jobs`)
  return results
}
