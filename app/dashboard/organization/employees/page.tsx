import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Mail, Calendar, Award, ChevronRight, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { InviteEmployee } from "@/components/invite-employee"

interface Program {
  id: string
  name: string
  is_active: boolean
}

interface Certificate {
  id: string
  status: string
  issued_date: string
  program: {
    name: string
  } | null
}

interface EmployeeProgress {
  id: string
  status: string
  program: Program | null
}

interface Employee {
  id: string
  avatar_url: string | null
  full_name: string
  email: string
  created_at: string
  employee_progress: EmployeeProgress[] | null
  certificates: Certificate[] | null
}

export default async function EmployeesPage() {
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

  // Get available certification programs
  const { data: programs } = await supabase
    .from("certification_programs")
    .select("id, name")
    .eq("organization_id", profile.organization.id)
    .eq("is_active", true)
    .order("name")

  // Get employees with their progress and certificates
  const { data: employees } = await supabase
    .from("profiles")
    .select(`
      *,
      employee_progress(
        *,
        program:certification_programs(
          id,
          name,
          is_active
        )
      ),
      certificates(
        id,
        status,
        issued_date,
        program:certification_programs(name)
      )
    `)
    .eq("organization_id", profile.organization.id)
    .eq("role", "employee")
    .order("created_at", { ascending: false })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      <div className="flex justify-between items-center mb-8">
        <div>
                    <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600 mt-1">
            Manage your organization's employees and their certifications
          </p>
        </div>
        <InviteEmployee programs={programs || []} />
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search employees by name or email..."
              className="w-full pl-10"
            />
          </div>
          <Button variant="outline">Filter</Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {employees?.map((employee) => {
            const activePrograms =
              employee.employee_progress?.filter(
                (p: EmployeeProgress) => 
                  (p.status === "in_progress" || p.status === "enrolled") && p.program?.is_active
              ) || []
            const completedPrograms = employee.employee_progress?.filter(
              (p: EmployeeProgress) => p.status === "completed"
            ) || []
            const activeCertificates = employee.certificates?.filter(
              (c: Certificate) => c.status === "active"
            ) || []

            return (
              <Link key={employee.id} href={`/dashboard/organization/employees/${employee.id}`}>
                <Card className="hover:shadow-lg transition-shadow group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={employee.avatar_url || "/placeholder.svg"} alt={employee.full_name} />
                          <AvatarFallback>{employee.full_name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center">
                            <h3 className="text-lg font-semibold text-gray-900">{employee.full_name}</h3>
                            <ChevronRight className="h-5 w-5 text-gray-400 ml-2 transition-transform group-hover:translate-x-1" />
                          </div>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <Mail className="h-4 w-4 mr-1 flex-shrink-0" />
                            {employee.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                            Joined {new Date(employee.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end text-sm text-gray-600 mb-2">
                          <Award className="h-4 w-4 mr-1" />
                          {activeCertificates.length} active {activeCertificates.length === 1 ? "certificate" : "certificates"}
                        </div>
                        <div className="space-x-2">
                          {activePrograms.length > 0 && (
                            <Badge variant="outline" className="bg-blue-50">
                              {activePrograms.length} active {activePrograms.length === 1 ? "program" : "programs"}
                            </Badge>
                          )}
                          {completedPrograms.length > 0 && (
                            <Badge variant="outline" className="bg-green-50">
                              {completedPrograms.length} completed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {(activePrograms.length > 0 || completedPrograms.length > 0) && (
                      <div className="mt-6 pt-6 border-t">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Programs</h4>
                        <div className="space-y-2">
                          {[...activePrograms, ...completedPrograms]
                            .slice(0, 3)
                            .map((progress) => (
                              <div key={progress.id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-700 truncate flex-1" title={progress.program?.name}>
                                  {progress.program?.name}
                                </span>
                                <Badge
                                  variant={progress.status === "completed" ? "default" : "secondary"}
                                  className="ml-2"
                                >
                                  {progress.status === "completed" ? "Completed" : "In Progress"}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}

          {(!employees || employees.length === 0) && (
            <Card className="text-center py-12">
              <CardContent>
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Plus className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No employees yet</h3>
                <p className="text-gray-600 mb-6">
                  Invite employees to join your organization and start their certification journey.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Your First Employee
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
