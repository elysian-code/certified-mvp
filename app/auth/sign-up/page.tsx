"use client"

import type React from "react"

import { _getUser, signUp } from "@/lib/server-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Award, CheckCircle, Users, FileText } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"

function SignUpForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState<string>("")
  const [organizationName, setOrganizationName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get("token")

  useEffect(() => {
    async function checkAuth() {
      const user = await _getUser()
      if (user) {
        router.push("/dashboard")
      }
    }
    checkAuth()
  }, [router])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }
    if (!inviteToken && !role) {
      setError("Please select a role")
      setIsLoading(false)
      return
    }
    try {
      const effectiveRole = inviteToken ? "employee" : role
      await signUp({ email, password, fullName, role: effectiveRole, organizationName })

      if (inviteToken) {
        const acceptResponse = await fetch("/api/accept-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: inviteToken, email }),
        })
        if (!acceptResponse.ok) {
          const data = await acceptResponse.json()
          console.warn("Invite acceptance failed:", data.message)
          setError(
            "Account created, but your invitation could not be automatically accepted. " +
            "Please contact your organization administrator to be added to the program."
          )
          setIsLoading(false)
          return
        }
      }

      router.push("/dashboard")
    } catch (error: any) {
      setError(error?.message || "An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex-col justify-between p-12 relative overflow-hidden">
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
            {inviteToken
              ? "You've been invited to join a program"
              : "Start building your certification program today"}
          </h2>
          <p className="text-indigo-200 text-lg mb-10 leading-relaxed">
            {inviteToken
              ? "Create your account to accept the invitation and start your learning journey."
              : "Create your organization account and launch your first certification program in minutes."}
          </p>
          <div className="space-y-4">
            {[
              { icon: Users, text: "Invite and manage your entire team" },
              { icon: CheckCircle, text: "Auto-graded CBT tests with performance levels" },
              { icon: FileText, text: "Download verified PDF certificates instantly" },
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center space-x-2.5 mb-10 justify-center">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Award className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">Certified</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
              {inviteToken ? "Accept your invitation" : "Create your account"}
            </h1>
            <p className="text-gray-500 text-sm">
              {inviteToken
                ? "Complete registration to join the certification program."
                : "Get started with professional certification management."}
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-10 border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                required
              />
            </div>

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

            {!inviteToken && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Account Type</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="h-10 border-gray-200 bg-gray-50">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organization_admin">Organization Admin</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {!inviteToken && role === "organization_admin" && (
              <div className="space-y-1.5">
                <Label htmlFor="organizationName" className="text-sm font-medium text-gray-700">Organization Name</Label>
                <Input
                  id="organizationName"
                  type="text"
                  placeholder="Acme Corp"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="h-10 border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm mt-2"
              disabled={isLoading}
            >
              {isLoading ? "Creating account…" : inviteToken ? "Accept & Create Account" : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-gray-500 text-sm">Loading…</div></div>}>
      <SignUpForm />
    </Suspense>
  )
}
