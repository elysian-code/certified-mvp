import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Mail, Calendar, Award } from "lucide-react"

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

  // Get employees with their progress
  const { data: employees } = await supabase
    .from("profiles")
    .select(`
      *,
      employee_progress(
        *,
        program:certification_programs(name)
      ),
      certificates(count)
    `)
    .eq("organization_id", profile.organization.id)
    .eq("role", "employee")
    .order("created_at", { ascending: false })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600">Manage your organization's employees and their progress</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Invite Employee
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {employees?.map((employee) => {
          const activePrograms =
            employee.employee_progress?.filter((p) => p.status === "in_progress" || p.status === "enrolled") || []
          const completedPrograms = employee.employee_progress?.filter((p) => p.status === "completed") || []
          const certificateCount = employee.certificates?.[0]?.count || 0

          return (
            <Card key={employee.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={employee.avatar_url || "/placeholder.svg"} alt={employee.full_name} />
                      <AvatarFallback>{employee.full_name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{employee.full_name}</h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Mail className="h-4 w-4 mr-1" />
                        {employee.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        Joined {new Date(employee.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Award className="h-4 w-4 mr-1" />
                      {certificateCount} certificates
                    </div>
                    <Badge variant="outline">{activePrograms.length} active programs</Badge>
                  </div>
                </div>

                {(activePrograms.length > 0 || completedPrograms.length > 0) && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Program Progress</h4>
                    <div className="space-y-2">
                      {activePrograms.map((progress) => (
                        <div key={progress.id} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{progress.program?.name}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${progress.progress_percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{progress.progress_percentage}%</span>
                            <Badge variant={progress.status === "in_progress" ? "default" : "secondary"}>
                              {progress.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {completedPrograms.map((progress) => (
                        <div key={progress.id} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{progress.program?.name}</span>
                          <Badge variant="default" className="bg-green-600">
                            Completed
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

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
            <Button>Invite Your First Employee</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
