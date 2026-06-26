"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Registration failed")
      } else {
        router.push("/login?registered=1")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 mx-auto shadow-lg shadow-indigo-900/50">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Create your account</h1>
        <p className="text-gray-400 text-sm">Start managing your job search like a pro</p>
      </div>

      <div className="bg-[#16161e] border border-[#2a2a3a] rounded-2xl p-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="6+ characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          {error && (
            <div className="text-red-400 text-sm bg-red-950/30 border border-red-800/30 rounded-lg px-3 py-2">{error}</div>
          )}
          <Button type="submit" className="w-full" loading={loading}>
            Create account
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link>
      </p>
    </div>
  )
}
