import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Award, FileText, TrendingUp, Calendar, CheckCircle } from "lucide-react"

export default async function OrganizationDashboardPage() {
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

  if (!profile || profile.role !== "organization_admin") {
    redirect("/dashboard")
  }

  // Get dashboard statistics
  const [programsResult, employeesResult, certificatesResult, progressResult] = await Promise.all([
    supabase.from("certification_programs").select("*").eq("organization_id", profile.organization.id),
    supabase.from("profiles").select("*").eq("organization_id", profile.organization.id).eq("role", "employee"),
    supabase.from("certificates").select("*").eq("organization_id", profile.organization.id),
    supabase
      .from("employee_progress")
      .select("*, program:certification_programs(*), employee:profiles(*)")
      .in(
        "program_id",
        (
          await supabase.from("certification_programs").select("id").eq("organization_id", profile.organization.id)
        ).data?.map((p) => p.id) || [],
      ),
  ])

  const programs = programsResult.data || []
  const employees = employeesResult.data || []
  const certificates = certificatesResult.data || []
  const progress = progressResult.data || []

  const activePrograms = programs.filter((p) => p.is_active).length
  const completedCertifications = certificates.filter((c) => c.status === "active").length
  const inProgressEmployees = progress.filter((p) => p.status === "in_progress").length
  const completionRate =
    progress.length > 0
      ? Math.round((progress.filter((p) => p.status === "completed").length / progress.length) * 100)
      : 0

  const recentActivity = progress
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Organization Dashboard</h1>
        <p className="text-gray-600">Welcome back, {profile.full_name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePrograms}</div>
            <p className="text-xs text-muted-foreground">{programs.length - activePrograms} inactive</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">{inProgressEmployees} in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates Issued</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCertifications}</div>
            <p className="text-xs text-muted-foreground">
              {certificates.filter((c) => c.status === "expired").length} expired
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">Overall program completion</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest employee progress updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {item.status === "completed" ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Calendar className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{item.employee?.full_name}</p>
                      <p className="text-sm text-gray-500">
                        {item.program?.name} - {item.progress_percentage}% complete
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge variant={item.status === "completed" ? "default" : "secondary"}>{item.status}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <a
                href="/dashboard/organization/programs/new"
                className="flex items-center p-3 text-sm font-medium text-gray-900 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <Award className="h-5 w-5 mr-3 text-blue-600" />
                Create New Program
              </a>
              <a
                href="/dashboard/organization/employees"
                className="flex items-center p-3 text-sm font-medium text-gray-900 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <Users className="h-5 w-5 mr-3 text-green-600" />
                Manage Employees
              </a>
              <a
                href="/dashboard/organization/certificates"
                className="flex items-center p-3 text-sm font-medium text-gray-900 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <FileText className="h-5 w-5 mr-3 text-purple-600" />
                Issue Certificate
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
