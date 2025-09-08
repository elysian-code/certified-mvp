import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, FileText, Clock, Calendar, Award, ArrowLeft, Play } from "lucide-react"
import Link from "next/link"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProgramDetailPage({ params }: PageProps) {
  const { id } = await params
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

  // Get program details and employee progress
  const [programResult, progressResult, testsResult, reportsResult] = await Promise.all([
    supabase.from("certification_programs").select("*").eq("id", id).single(),
    supabase.from("employee_progress").select("*").eq("employee_id", profile.id).eq("program_id", id).single(),
    supabase.from("cbt_tests").select("*").eq("program_id", id).eq("is_active", true),
    supabase
      .from("employee_reports")
      .select("*")
      .eq("employee_id", profile.id)
      .eq("program_id", id)
      .order("created_at", { ascending: false }),
  ])

  const program = programResult.data
  const progress = progressResult.data
  const tests = testsResult.data || []
  const reports = reportsResult.data || []

  if (!program) {
    redirect("/dashboard/employee/programs")
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href="/dashboard/employee/programs"
          className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Programs
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{program.name}</h1>
            <p className="text-gray-600 mt-2">{program.description}</p>
          </div>
          {progress && (
            <Badge variant={progress.status === "completed" ? "default" : "secondary"} className="text-sm">
              {progress.status}
            </Badge>
          )}
        </div>
      </div>

      {progress && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
            <CardDescription>Track your completion status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span>{progress.progress_percentage}%</span>
                </div>
                <Progress value={progress.progress_percentage} className="h-3" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  Enrolled: {new Date(progress.enrollment_date).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  Duration: {program.duration_months} months
                </div>
                {progress.completion_date && (
                  <div className="flex items-center">
                    <Award className="h-4 w-4 mr-2 text-green-500" />
                    Completed: {new Date(progress.completion_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tests">Assessments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-gray-600">{program.description}</p>
                </div>
                {program.requirements && (
                  <div>
                    <h4 className="font-medium mb-2">Requirements</h4>
                    <p className="text-gray-600">{program.requirements}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-medium mb-2">Duration</h4>
                  <p className="text-gray-600">{program.duration_months} months</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tests.length > 0 && (
                  <Link href={`/dashboard/employee/programs/${id}/tests`}>
                    <Button className="w-full justify-start">
                      <Play className="h-4 w-4 mr-2" />
                      Take Assessment
                    </Button>
                  </Link>
                )}
                <Link href={`/dashboard/employee/programs/${id}/reports/new`}>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    Submit Report
                  </Button>
                </Link>
                <Link href={`/dashboard/employee/programs/${id}/materials`}>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Study Materials
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tests">
          <div className="space-y-6">
            {tests.length > 0 ? (
              tests.map((test) => (
                <Card key={test.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{test.name}</CardTitle>
                        <CardDescription>{test.description}</CardDescription>
                      </div>
                      <Badge variant="outline">{test.passing_score}% to pass</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {test.time_limit_minutes} minutes
                        </div>
                      </div>
                      <Link href={`/dashboard/employee/tests/${test.id}`}>
                        <Button>
                          <Play className="h-4 w-4 mr-2" />
                          Start Test
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments available</h3>
                  <p className="text-gray-600">Assessments will appear here when they become available.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Submitted Reports</h3>
              <Link href={`/dashboard/employee/programs/${id}/reports/new`}>
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  New Report
                </Button>
              </Link>
            </div>

            {reports.length > 0 ? (
              <div className="space-y-4">
                {reports.map((report) => (
                  <Card key={report.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg capitalize">{report.report_type} Report</CardTitle>
                          <CardDescription>
                            Submitted {new Date(report.submitted_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            report.status === "approved"
                              ? "default"
                              : report.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {report.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 line-clamp-3">{report.content}</p>
                      {report.reviewed_at && (
                        <p className="text-sm text-gray-500 mt-2">
                          Reviewed {new Date(report.reviewed_at).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reports submitted</h3>
                  <p className="text-gray-600 mb-4">Submit your first report to track your progress.</p>
                  <Link href={`/dashboard/employee/programs/${id}/reports/new`}>
                    <Button>Submit Your First Report</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
