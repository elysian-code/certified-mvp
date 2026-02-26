import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Organization Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back, <span className="font-medium text-gray-700">{profile.full_name}</span>
            {profile.organization && (
              <span className="text-gray-400"> · {profile.organization.name}</span>
            )}
          </p>
        </div>
        <a
          href="/dashboard/organization/programs/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
        >
          <span>+ New Program</span>
        </a>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            label: "Active Programs",
            value: activePrograms,
            sub: `${programs.length - activePrograms} inactive`,
            iconBg: "bg-indigo-50",
            iconColor: "text-indigo-600",
            Icon: Award,
          },
          {
            label: "Total Employees",
            value: employees.length,
            sub: `${inProgressEmployees} in progress`,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            Icon: Users,
          },
          {
            label: "Certificates Issued",
            value: completedCertifications,
            sub: `${certificates.filter((c) => c.status === "expired").length} expired`,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            Icon: FileText,
          },
          {
            label: "Completion Rate",
            value: `${completionRate}%`,
            sub: "Overall program completion",
            iconBg: "bg-violet-50",
            iconColor: "text-violet-600",
            Icon: TrendingUp,
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

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-5 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
            <p className="text-xs text-gray-400 mt-0.5">Latest employee progress updates</p>
          </div>
          <div className="p-6 space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {item.status === "completed" ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.employee?.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {item.program?.name} · {item.progress_percentage}% complete
                    </p>
                  </div>
                  <Badge
                    variant={item.status === "completed" ? "default" : "secondary"}
                    className={`text-xs shrink-0 ${item.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}
                  >
                    {item.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No recent activity yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-5 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Quick Actions</h2>
            <p className="text-xs text-gray-400 mt-0.5">Common tasks and shortcuts</p>
          </div>
          <div className="p-5 space-y-2.5">
            {[
              {
                href: "/dashboard/organization/programs/new",
                icon: Award,
                iconBg: "bg-indigo-50",
                iconColor: "text-indigo-600",
                label: "Create New Program",
                desc: "Set up a new certification program",
              },
              {
                href: "/dashboard/organization/employees",
                icon: Users,
                iconBg: "bg-blue-50",
                iconColor: "text-blue-600",
                label: "Manage Employees",
                desc: "View and manage your team",
              },
              {
                href: "/dashboard/organization/certificates",
                icon: FileText,
                iconBg: "bg-emerald-50",
                iconColor: "text-emerald-600",
                label: "View Certificates",
                desc: "Browse issued certificates",
              },
            ].map((action) => (
              <a
                key={action.href}
                href={action.href}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-xl ${action.iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                  <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{action.label}</p>
                  <p className="text-xs text-gray-400">{action.desc}</p>
                </div>
                <span className="text-gray-300 group-hover:text-gray-500 transition-colors text-lg">›</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
