"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Briefcase, Building2, Users, Mail,
  FileText, BarChart3, Calendar, Settings, ChevronLeft,
  ChevronRight, KanbanSquare, Zap, Telescope
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/discover", icon: Telescope, label: "Discover", badge: "LIVE" as string },
  { href: "/pipeline", icon: KanbanSquare, label: "Pipeline" },
  { href: "/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/companies", icon: Building2, label: "Companies" },
  { href: "/recruiters", icon: Users, label: "Recruiters" },
  { href: "/emails", icon: Mail, label: "Emails" },
  { href: "/documents", icon: FileText, label: "Documents" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/calendar", icon: Calendar, label: "Calendar" },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="flex flex-col h-full bg-[#12121a] border-r border-[#2a2a3a] overflow-hidden shrink-0"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-[#2a2a3a]">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-bold text-white text-lg tracking-tight"
            >
              JobOS
            </motion.span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/")
            const Icon = item.icon
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-150 group",
                      active
                        ? "bg-indigo-600/20 text-indigo-300 border border-indigo-600/30"
                        : "text-gray-400 hover:bg-[#1e1e2a] hover:text-white"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", active && "text-indigo-400")} />
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 flex-1 truncate"
                      >
                        {item.label}
                        {"badge" in item && item.badge && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-600/30 text-emerald-400 font-bold tracking-wide">{item.badge}</span>
                        )}
                      </motion.span>
                    )}
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">{item.label}</TooltipContent>
                )}
              </Tooltip>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-2 py-3 border-t border-[#2a2a3a] space-y-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className={cn(
                  "flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-all text-gray-400 hover:bg-[#1e1e2a] hover:text-white",
                  pathname === "/settings" && "bg-indigo-600/20 text-indigo-300"
                )}
              >
                <Settings className="w-4 h-4 shrink-0" />
                {!collapsed && <span>Settings</span>}
              </Link>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Settings</TooltipContent>}
          </Tooltip>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-gray-500 hover:bg-[#1e1e2a] hover:text-gray-300 transition-all w-full"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
