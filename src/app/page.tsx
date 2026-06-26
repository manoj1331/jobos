"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Zap, BarChart3, KanbanSquare, Users, Mail, Shield, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
  { icon: KanbanSquare, title: "Drag-and-drop Pipeline", desc: "Kanban board with 11 stages. Drag jobs to update status instantly." },
  { icon: BarChart3, title: "Deep Analytics", desc: "Response rates, offer rates, funnel analysis, and skill insights." },
  { icon: Users, title: "Recruiter CRM", desc: "Track every recruiter contact, follow-ups, and relationship status." },
  { icon: Mail, title: "Email Templates", desc: "Cold outreach, follow-ups, thank you notes — all with variable substitution." },
  { icon: Shield, title: "Your Data, Your Privacy", desc: "Self-hosted, no third parties, full export at any time." },
  { icon: Zap, title: "Command Palette", desc: "Instant global search across jobs, companies, and recruiters. ⌘K." },
]

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") router.push("/dashboard")
  }, [status, router])

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f13]">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-[#2a2a3a]/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg">JobOS</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-8 pt-24 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/20 border border-indigo-600/30 text-indigo-300 text-sm mb-6">
            <Zap className="w-3.5 h-3.5" />
            Personal Job Search OS
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Your job search,<br />finally organized
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            The command center you always wanted. Track jobs, manage recruiter relationships, and get analytics — all in one beautiful dashboard.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start for free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">Sign in</Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-8 pb-24">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.3 }}
              className="bg-[#16161e] border border-[#2a2a3a] rounded-xl p-5 hover:border-[#3a3a4a] transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-600/20 flex items-center justify-center mb-3">
                <f.icon className="w-4 h-4 text-indigo-400" />
              </div>
              <h3 className="font-semibold text-white mb-1">{f.title}</h3>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
