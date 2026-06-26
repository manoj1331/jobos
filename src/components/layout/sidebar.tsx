"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Zap, Search, Bookmark, CheckCircle, Settings } from "lucide-react"

const NAV = [
  { href: "/discover", icon: Search, label: "Find Jobs" },
  { href: "/saved", icon: Bookmark, label: "Saved" },
  { href: "/applied", icon: CheckCircle, label: "Applied" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

export function Sidebar() {
  const path = usePathname()
  return (
    <aside className="flex flex-col w-56 shrink-0 h-full bg-[#12121a] border-r border-[#2a2a3a]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#2a2a3a]">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-white text-base tracking-tight">JobOS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = path === href || path.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-600/30"
                  : "text-gray-400 hover:bg-[#1e1e2a] hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
