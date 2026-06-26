"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function RootPage() {
  const { status } = useSession()
  const router = useRouter()
  useEffect(() => {
    if (status === "authenticated") router.replace("/discover")
    else if (status === "unauthenticated") router.replace("/login")
  }, [status, router])
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f13]">
      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
