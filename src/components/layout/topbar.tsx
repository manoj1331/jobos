"use client"

import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Topbar() {
  const { data: session } = useSession()
  const initials = session?.user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "?"

  return (
    <header className="h-13 flex items-center justify-end px-6 border-b border-[#2a2a3a] bg-[#12121a] shrink-0 py-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="outline-none">
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <div className="px-2 py-1.5">
            <div className="text-xs font-medium text-white truncate">{session?.user?.name}</div>
            <div className="text-xs text-gray-500 truncate">{session?.user?.email}</div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })} className="text-red-400">
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
