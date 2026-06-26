"use client"

import { Search, Bell, Plus } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface TopbarProps {
  onSearch: () => void
  onAddJob?: () => void
}

export function Topbar({ onSearch, onAddJob }: TopbarProps) {
  const { data: session } = useSession()
  const initials = session?.user?.name
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?"

  return (
    <header className="h-14 flex items-center gap-3 px-6 border-b border-[#2a2a3a] bg-[#12121a]/80 backdrop-blur-sm shrink-0">
      {/* Search */}
      <button
        onClick={onSearch}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2a2a3a] bg-[#16161e] text-gray-400 hover:text-gray-200 hover:border-[#3a3a4a] transition-all text-sm flex-1 max-w-xs"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="text-xs bg-[#2a2a3a] px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
      </button>

      <div className="flex-1" />

      {/* Add Job */}
      <Button size="sm" onClick={onAddJob} className="gap-1.5">
        <Plus className="w-3.5 h-3.5" />
        Add Job
      </Button>

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="w-4 h-4" />
      </Button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="outline-none">
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>
            <div className="font-medium text-white">{session?.user?.name}</div>
            <div className="text-xs text-gray-500 font-normal">{session?.user?.email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings">Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-red-400 focus:text-red-300"
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
