import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
      .eq("organization_id", profile.organization.id)
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-600">Welcome back, {profile.full_name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProgress.length}</div>
            <p className="text-xs text-muted-foreground">{completedProgress.length} completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCertificates.length}</div>
            <p className="text-xs text-muted-foreground">
              {certificates.filter((c) => c.status === "expired").length} expired
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeProgress.length > 0
                ? Math.round(activeProgress.reduce((sum, p) => sum + p.progress_percentage, 0) / activeProgress.length)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Across all programs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Programs</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unenrolledPrograms.length}</div>
            <p className="text-xs text-muted-foreground">Ready to enroll</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Programs */}
        <Card>
          <CardHeader>
            <CardTitle>Active Programs</CardTitle>
            <CardDescription>Your current certification progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeProgress.length > 0 ? (
                activeProgress.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{item.program?.name}</h4>
                      <Badge variant={item.status === "in_progress" ? "default" : "secondary"}>{item.status}</Badge>
                    </div>
                    <Progress value={item.progress_percentage} className="h-2" />
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{item.progress_percentage}% complete</span>
                      <Link href={`/dashboard/employee/programs/${item.program_id}`}>
                        <Button variant="outline" size="sm">
                          Continue
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No active programs. Enroll in a program to get started.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Certificates */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Certificates</CardTitle>
            <CardDescription>Your latest achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {certificates.length > 0 ? (
                certificates.slice(0, 3).map((cert) => (
                  <div key={cert.id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Award className="h-8 w-8 text-yellow-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{cert.program?.name}</p>
                      <p className="text-sm text-gray-500">Issued {new Date(cert.issued_date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge variant={cert.status === "active" ? "default" : "secondary"}>{cert.status}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No certificates yet. Complete a program to earn your first!</p>
              )}
              {certificates.length > 0 && (
                <Link href="/dashboard/employee/certificates">
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    View All Certificates
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Programs */}
      {unenrolledPrograms.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Available Programs</CardTitle>
            <CardDescription>Certification programs you can enroll in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unenrolledPrograms.map((program) => (
                <div key={program.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium mb-2">{program.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{program.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {program.duration_months} months
                    </div>
                    <Link href={`/dashboard/employee/programs/enroll/${program.id}`}>
                      <Button size="sm">Enroll</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
