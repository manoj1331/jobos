"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Zap, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
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
      const res = await signIn("credentials", {
        email, password, redirect: false,
      })
      if (res?.error) {
        setError("Invalid email or password")
      } else {
        router.push("/dashboard")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 mx-auto shadow-lg shadow-indigo-900/50">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Welcome to JobOS</h1>
        <p className="text-gray-400 text-sm">Your personal job search command center</p>
      </div>

      {/* Form */}
      <div className="bg-[#16161e] border border-[#2a2a3a] rounded-2xl p-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="text-red-400 text-sm bg-red-950/30 border border-red-800/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" loading={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-indigo-400 hover:text-indigo-300">
          Create one
        </Link>
      </p>
    </div>
  )
}
