import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSalary(min?: number | null, max?: number | null, currency = "USD") {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(date)
  );
}

export function timeAgo(date: string | Date | null | undefined) {
  if (!date) return null;
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 30) return formatDate(date);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

export const JOB_STATUSES = [
  "saved",
  "researching",
  "ready",
  "applied",
  "recruiter_contacted",
  "referral_requested",
  "oa",
  "phone_screen",
  "technical",
  "system_design",
  "manager_round",
  "hr_round",
  "final_round",
  "offer",
  "negotiation",
  "accepted",
  "rejected",
  "archived",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const STATUS_LABELS: Record<string, string> = {
  saved: "Saved",
  researching: "Researching",
  ready: "Ready to Apply",
  applied: "Applied",
  recruiter_contacted: "Recruiter Contacted",
  referral_requested: "Referral Requested",
  oa: "OA",
  phone_screen: "Phone Screen",
  technical: "Technical Round",
  system_design: "System Design",
  manager_round: "Manager Round",
  hr_round: "HR Round",
  final_round: "Final Round",
  offer: "Offer",
  negotiation: "Negotiation",
  accepted: "Accepted",
  rejected: "Rejected",
  archived: "Archived",
};

export const STATUS_COLORS: Record<string, string> = {
  saved: "bg-slate-500",
  researching: "bg-blue-500",
  ready: "bg-cyan-500",
  applied: "bg-indigo-500",
  recruiter_contacted: "bg-violet-500",
  referral_requested: "bg-purple-500",
  oa: "bg-yellow-500",
  phone_screen: "bg-orange-400",
  technical: "bg-orange-500",
  system_design: "bg-amber-500",
  manager_round: "bg-rose-400",
  hr_round: "bg-pink-500",
  final_round: "bg-red-500",
  offer: "bg-green-500",
  negotiation: "bg-emerald-500",
  accepted: "bg-green-600",
  rejected: "bg-red-600",
  archived: "bg-slate-600",
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: "text-slate-400",
  medium: "text-amber-400",
  high: "text-red-400",
};

export const PIPELINE_COLUMNS = [
  { id: "saved", label: "Saved", color: "border-slate-500" },
  { id: "researching", label: "Researching", color: "border-blue-500" },
  { id: "ready", label: "Ready", color: "border-cyan-500" },
  { id: "applied", label: "Applied", color: "border-indigo-500" },
  { id: "phone_screen", label: "Phone Screen", color: "border-orange-400" },
  { id: "technical", label: "Technical", color: "border-orange-500" },
  { id: "final_round", label: "Final Round", color: "border-red-500" },
  { id: "offer", label: "Offer", color: "border-green-500" },
  { id: "negotiation", label: "Negotiation", color: "border-emerald-500" },
  { id: "accepted", label: "Accepted", color: "border-green-600" },
  { id: "rejected", label: "Rejected", color: "border-red-600" },
];
