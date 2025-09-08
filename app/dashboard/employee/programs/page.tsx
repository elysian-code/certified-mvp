import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Clock, Calendar, FileText, Award } from "lucide-react"
import Link from "next/link"

export default async function EmployeeProgramsPage() {
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

  // Get employee progress
  const { data: progress } = await supabase
    .from("employee_progress")
    .select(`
      *,
      program:certification_programs(*)
    `)
    .eq("employee_id", profile.id)
    .order("updated_at", { ascending: false })

  const activePrograms = progress?.filter((p) => p.status === "in_progress" || p.status === "enrolled") || []
  const completedPrograms = progress?.filter((p) => p.status === "completed") || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Programs</h1>
        <p className="text-gray-600">Track your certification progress and access program materials</p>
      </div>

      {/* Active Programs */}
      {activePrograms.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Programs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activePrograms.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{item.program?.name}</CardTitle>
                      <CardDescription className="mt-2">{item.program?.description}</CardDescription>
                    </div>
                    <Badge variant={item.status === "in_progress" ? "default" : "secondary"}>{item.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{item.progress_percentage}%</span>
                      </div>
                      <Progress value={item.progress_percentage} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Enrolled {new Date(item.enrollment_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        {item.program?.duration_months} months
                      </div>
                    </div>

                    {item.program?.requirements && (
                      <div className="text-sm">
                        <strong>Requirements:</strong> {item.program.requirements}
                      </div>
                    )}

                    <div className="flex space-x-2 pt-2">
                      <Link href={`/dashboard/employee/programs/${item.program_id}`}>
                        <Button size="sm">Continue Program</Button>
                      </Link>
                      <Link href={`/dashboard/employee/programs/${item.program_id}/reports`}>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          Reports
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Programs */}
      {completedPrograms.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed Programs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedPrograms.map((item) => (
              <Card key={item.id} className="border-green-200 bg-green-50">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        <Award className="h-5 w-5 text-green-600 mr-2" />
                        {item.program?.name}
                      </CardTitle>
                    </div>
                    <Badge className="bg-green-600">Completed</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Completed {item.completion_date ? new Date(item.completion_date).toLocaleDateString() : "N/A"}
                    </div>
                    <Link href={`/dashboard/employee/certificates`}>
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        View Certificate
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!progress || progress.length === 0) && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No programs yet</h3>
            <p className="text-gray-600 mb-6">Enroll in a certification program to start your learning journey.</p>
            <Link href="/dashboard/employee">
              <Button>Browse Available Programs</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
