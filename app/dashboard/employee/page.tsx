import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Award, BookOpen, Clock, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

export default async function EmployeeDashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organization:organizations(*)")
    .eq("id", data.user.id)
    .single()

  if (!profile || profile.role !== "employee") {
    redirect("/dashboard")
  }

  // Check if profile has organization
  if (!profile.organization_id) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600">Welcome, {profile.full_name}</p>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No Organization Assigned</h3>
              <p className="mt-1 text-sm text-gray-500">Please contact your administrator to get assigned to an organization.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get employee progress and certificates
  const [progressResult, certificatesResult, availableProgramsResult] = await Promise.all([
    supabase
      .from("employee_progress")
      .select(`
        *,
        program:certification_programs(*)
      `)
      .eq("employee_id", profile.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("certificates")
      .select(`
        *,
        program:certification_programs(name)
      `)
      .eq("employee_id", profile.id)
      .order("issued_date", { ascending: false }),
    supabase
      .from("certification_programs")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .eq("is_active", true),
  ])

  const progress = progressResult.data || []
  const certificates = certificatesResult.data || []
  const availablePrograms = availableProgramsResult.data || []

  const enrolledProgramIds = progress.map((p) => p.program_id)
  const unenrolledPrograms = availablePrograms.filter((p) => !enrolledProgramIds.includes(p.id))

  const activeProgress = progress.filter((p) => p.status === "in_progress" || p.status === "enrolled")
  const completedProgress = progress.filter((p) => p.status === "completed")
  const activeCertificates = certificates.filter((c) => c.status === "active")
  const avgProgressPct =
    activeProgress.length > 0
      ? Math.round(activeProgress.reduce((sum, p) => sum + p.progress_percentage, 0) / activeProgress.length)
      : 0

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back, <span className="font-medium text-gray-700">{profile.full_name}</span>
          {profile.organization && (
            <span className="text-gray-400"> · {profile.organization.name}</span>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            label: "Active Programs",
            value: activeProgress.length,
            sub: `${completedProgress.length} completed`,
            iconBg: "bg-indigo-50",
            iconColor: "text-indigo-600",
            Icon: BookOpen,
          },
          {
            label: "Certificates Earned",
            value: activeCertificates.length,
            sub: `${certificates.filter((c) => c.status === "expired").length} expired`,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
            Icon: Award,
          },
          {
            label: "Average Progress",
            value: `${avgProgressPct}%`,
            sub: "Across active programs",
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            Icon: CheckCircle,
          },
          {
            label: "Available Programs",
            value: unenrolledPrograms.length,
            sub: "Ready to enroll",
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            Icon: AlertCircle,
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">{stat.label}</span>
              <div className={`w-8 h-8 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                <stat.Icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <p className="text-xs text-gray-400">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Programs */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-5 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Active Programs</h2>
            <p className="text-xs text-gray-400 mt-0.5">Your current certification progress</p>
          </div>
          <div className="p-6 space-y-5">
            {activeProgress.length > 0 ? (
              activeProgress.map((item) => (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.program?.name}</p>
                    <Badge
                      className={`shrink-0 text-xs ${item.status === "in_progress" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <Progress value={item.progress_percentage} className="h-1.5" />
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{item.progress_percentage}% complete</span>
                    <Link href={`/dashboard/employee/programs/${item.program_id}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs border-gray-200 hover:bg-gray-50">
                        Continue →
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400 mb-3">No active programs yet.</p>
                <Link href="/dashboard/employee">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8">
                    Browse Programs
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Certificates */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-5 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Recent Certificates</h2>
            <p className="text-xs text-gray-400 mt-0.5">Your latest achievements</p>
          </div>
          <div className="p-6 space-y-4">
            {certificates.length > 0 ? (
              <>
                {certificates.slice(0, 3).map((cert) => (
                  <div key={cert.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <Award className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{cert.program?.name}</p>
                      <p className="text-xs text-gray-400">Issued {new Date(cert.issued_date).toLocaleDateString()}</p>
                    </div>
                    <Badge
                      className={`shrink-0 text-xs ${cert.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}
                    >
                      {cert.status}
                    </Badge>
                  </div>
                ))}
                <Link href="/dashboard/employee/certificates">
                  <Button variant="outline" size="sm" className="w-full mt-2 text-xs h-8 border-gray-200 hover:bg-gray-50">
                    View All Certificates
                  </Button>
                </Link>
              </>
            ) : (
              <div className="text-center py-8">
                <Award className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No certificates yet.</p>
                <p className="text-xs text-gray-300 mt-1">Complete a program to earn your first!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Available Programs */}
      {unenrolledPrograms.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-5 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Available Programs</h2>
            <p className="text-xs text-gray-400 mt-0.5">Certification programs you can enroll in</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unenrolledPrograms.map((program) => (
                <div
                  key={program.id}
                  className="rounded-xl border border-gray-100 p-5 hover:border-indigo-200 hover:shadow-sm transition-all"
                >
                  <h4 className="text-sm font-semibold text-gray-900 mb-1.5">{program.name}</h4>
                  <p className="text-xs text-gray-400 mb-4 line-clamp-2">{program.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-400">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {program.duration_months} months
                    </div>
                    <Link href={`/dashboard/employee/programs/enroll/${program.id}`}>
                      <Button size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                        Enroll
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
