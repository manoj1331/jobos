export interface NormalizedJob {
  externalId: string
  source: string
  title: string
  company: string
  companyLogo?: string
  companyWebsite?: string
  location: string
  isRemote: boolean
  isHybrid: boolean
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
  description?: string
  skills: string[]
  applyUrl: string
  jobType?: string
  experienceMin?: number
  experienceMax?: number
  postedAt?: Date
  companyType?: string
}

// Strictly allowed job title patterns — ONLY these 4 roles
const ALLOWED_TITLE_PATTERNS = [
  /\bdevops\s*(engineer|dev|specialist|lead|architect)\b/i,
  /\bcloud\s*(engineer|specialist|architect|lead)\b/i,
  /\bplatform\s*(engineer|specialist|lead|architect)\b/i,
  /\bcloud\s*support\s*(engineer|specialist|lead)\b/i,
]

// Fragments that disqualify a title even if it matched above
const DISALLOWED_TITLE_FRAGMENTS = [
  "software engineer","software developer","full stack","fullstack",
  "frontend","back end","backend","java developer","python developer",
  "golang developer","node developer","react developer","angular developer",
  "data engineer","data scientist","ml engineer","ai engineer",
  "machine learning","deep learning","nlp engineer",
  "qa engineer","quality assurance","test engineer","sdet",
  "network engineer","security engineer","cybersecurity","devsecops",
  "mobile developer","android developer","ios developer",
  "ui engineer","ux engineer","product designer",
  "business analyst","product manager","scrum master",
  "database administrator","dba","bi developer","etl developer",
  "embedded engineer","firmware engineer","hardware engineer",
  "blockchain","web3","smart contract",
  "support engineer",
]

export function isStrictlyRelevant(title: string): boolean {
  const t = title.toLowerCase().trim()
  if (!ALLOWED_TITLE_PATTERNS.some(p => p.test(t))) return false
  if (DISALLOWED_TITLE_FRAGMENTS.some(f => t.includes(f))) return false
  return true
}

const EXP_RANGE = /(\d+(?:\.\d+)?)\s*[-–to]+\s*(\d+(?:\.\d+)?)\s*(?:yr|year|yrs|years)/i
const EXP_SINGLE = /(\d+)\+?\s*(?:yr|year|yrs|years)/i

export function isExperienceCompatible(description?: string, title?: string): boolean {
  const text = `${title ?? ""} ${description ?? ""}`.slice(0, 2000)
  const range = EXP_RANGE.exec(text)
  if (range) {
    const min = parseFloat(range[1])
    const max = parseFloat(range[2])
    if (max < 2 || min > 7) return false
    return true
  }
  const single = EXP_SINGLE.exec(text)
  if (single) {
    const n = parseFloat(single[1])
    if (n > 8) return false
  }
  return true
}

export const EXCLUDED_COMPANIES = [
  "tcs","tata consultancy","infosys","wipro","hcl technologies",
  "hcltech","cognizant","capgemini","tech mahindra","techmahindra",
  "accenture","ibm services","ibm global","ltimindtree","mphasis",
  "dxc technology","cgi inc","hexaware","birlasoft","persistent systems",
  "mindtree","niit technologies","mastech","igate","patni",
  "l&t infotech","larsen toubro infotech","syntel","unisys","atos",
  "sopra steria","ntt data","fujitsu","kyndryl","stefanini","softchoice",
  "genpact","wns global","firstsource","zensar","geometric","cyient",
  "sasken","kpit","convergys",
]

export function isExcludedCompany(company: string): boolean {
  const c = company.toLowerCase()
  return EXCLUDED_COMPANIES.some(ex => c.includes(ex))
}

// Titles that suggest too-senior or too-junior levels
const LEVEL_DISQUALIFIERS = [
  "principal ", "staff ", "distinguished ", "vp ", "vice president",
  "director of ", "head of ", "chief ", "c-level", "architect ",
  "manager ", "lead engineer", // lead alone is ok (platform lead etc.)
]

export function isLevelCompatible(title: string): boolean {
  const t = title.toLowerCase()
  // Exclude very senior titles
  if (LEVEL_DISQUALIFIERS.some(d => t.startsWith(d) || t.includes(` ${d.trim()} `))) return false
  // "Senior X" is on the border — include it (3.6 yrs can apply to senior roles too)
  return true
}

// ── South India location filter ───────────────────────────────────────────────
export const SOUTH_INDIA_CITIES = [
  // Karnataka
  "bangalore", "bengaluru", "mysore", "mysuru", "mangalore", "mangaluru",
  "hubli", "dharwad", "belgaum", "belagavi", "shimoga",
  // Telangana
  "hyderabad", "secunderabad", "warangal", "nizamabad",
  // Tamil Nadu
  "chennai", "madras", "coimbatore", "madurai", "trichy", "tiruchirappalli",
  "salem", "tirunelveli", "vellore", "erode", "tiruppur",
  // Andhra Pradesh
  "visakhapatnam", "vizag", "vijayawada", "guntur", "tirupati",
  "nellore", "kurnool", "kakinada", "rajahmundry",
  // Kerala
  "kochi", "cochin", "thiruvananthapuram", "trivandrum", "kozhikode",
  "calicut", "thrissur", "kollam", "kannur",
  // General India
  "india", "south india", "remote, india", "india (remote)",
  "pan india", "work from home india", "wfh india",
]

export function isLocationCompatible(location?: string): boolean {
  if (!location) return false
  const loc = location.toLowerCase().trim()

  // Always include remote jobs — accessible from anywhere in South India
  if (
    loc === "remote" ||
    loc === "worldwide" ||
    loc === "anywhere" ||
    loc === "global" ||
    loc.includes("remote") ||
    loc.includes("work from home") ||
    loc.includes("wfh")
  ) return true

  // Check for South India cities/states
  return SOUTH_INDIA_CITIES.some(city => loc.includes(city))
}
