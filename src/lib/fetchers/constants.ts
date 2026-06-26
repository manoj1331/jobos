export const TARGET_ROLES = [
  "devops", "cloud engineer", "platform engineer", "cloud support",
  "site reliability", "sre", "infrastructure engineer", "kubernetes",
  "k8s", "devsecops", "mlops", "cloudops", "cloud architect",
  "cloud native", "cloud operations", "reliability engineer",
  "build engineer", "release engineer", "ci/cd", "gitops",
]

export const EXCLUDED_COMPANIES = [
  "tcs", "tata consultancy", "infosys", "wipro", "hcl technologies",
  "hcltech", "cognizant", "capgemini", "tech mahindra", "techmahindra",
  "accenture", "ibm services", "ibm global", "ltimindtree", "mphasis",
  "dxc technology", "cgi inc", "hexaware", "birlasoft",
  "persistent systems", "mindtree", "niit technologies", "mastech",
  "igate", "patni", "l&t infotech", "larsen toubro infotech",
  "syntel", "unisys", "atos", "sopra steria", "ntt data",
  "fujitsu", "kyndryl", "stefanini", "softchoice",
]

export const isExcludedCompany = (company: string): boolean => {
  const lower = company.toLowerCase()
  return EXCLUDED_COMPANIES.some(ex => lower.includes(ex))
}

export const isRelevantRole = (title: string, description?: string): boolean => {
  const text = `${title} ${description ?? ""}`.toLowerCase()
  return TARGET_ROLES.some(role => text.includes(role))
}

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
  postedAt?: Date
  companyType?: string
}
