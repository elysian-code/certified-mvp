"use client"

import type React from "react"

import { _getUser, login } from "@/lib/server-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Award, CheckCircle, Shield, Zap } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const user = await _getUser()
      if (user) {
        router.push("/dashboard")
      }
    }
    checkAuth()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const data = await login({ email, password })
      if (data?.user) {
        router.push("/dashboard")
      } else {
        setError("Invalid login credentials.")
      }
    } catch (error: any) {
      setError(error?.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Award className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Certified</span>
          </Link>
        </div>

        <div className="relative">
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Welcome back to your certification hub
          </h2>
          <p className="text-indigo-200 text-lg mb-10 leading-relaxed">
            Sign in to manage programs, track learner progress, and issue verified certificates.
          </p>
          <div className="space-y-4">
            {[
              { icon: CheckCircle, text: "Manage certification programs end-to-end" },
              { icon: Shield, text: "Tamper-proof certificate verification" },
              { icon: Zap, text: "AI-powered CBT test generation" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-indigo-100 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <p className="text-indigo-300 text-sm">
            © {new Date().getFullYear()} Certified. Professional certification management.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center space-x-2.5 mb-10 justify-center">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Award className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">Certified</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1.5">Sign in to your account</h1>
            <p className="text-gray-500 text-sm">Enter your credentials to access your dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                <Link href="/auth/reset-password" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                required
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg">
                <span className="mt-0.5 shrink-0">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm"
              disabled={isLoading}
            >
              {isLoading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/auth/sign-up" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
