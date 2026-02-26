import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EnrollEmployees } from "@/components/enroll-employees"

interface Profile {
  id: string
  role: string
  organization: {
    id: string
  }
}

interface CertificationProgram {
  id: string
  name: string
  description: string | null
  requirements: string | null
  duration_months: number
  is_active: boolean
  organization_id: string
  certificate_template: string
  created_at: string
  enrollments: Array<{ id: string }>
  // Added for TypeScript completeness
  updated_at?: string
  questions_count?: number
  passing_score?: number
  report_submission_method?: string
  test_duration_minutes?: number
}

export default async function ProgramPage({
  params,
}: {
  params: { id: string }
}) {
  if (!params?.id) {
    notFound()
  }

  const supabase = await createClient()

  // Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  // Get user profile and verify organization admin
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*, organization:organizations(*)")
    .eq("id", user.id)
    .single() as { data: Profile | null; error: any }

  if (profileError || !profile || !profile.organization) {
    redirect("/auth/login")
  }

  if (profile.role !== "organization_admin") {
    redirect("/dashboard/employee")
  }

  // Get program details
  const { data: program, error: programError } = await supabase
    .from("certification_programs")
    .select(`
      *,
      enrollments:employee_progress(id)
    `)
    .eq("id", params.id)
    .single() as { data: CertificationProgram | null; error: any }

  if (programError || !program) {
    notFound()
  }

  // Verify program belongs to user's organization
  if (program.organization_id !== profile.organization.id) {
    redirect("/dashboard/organization/programs")
  }

  const enrollmentCount = program.enrollments?.length ?? 0

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/dashboard/organization/programs"
            className="inline-flex items-center text-blue-600 hover:text-blue-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Programs
          </Link>
          <Link
            href={`/dashboard/organization/programs/${program.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Edit Program
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{program.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Created on {new Date(program.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={program.is_active ? "default" : "secondary"} className="text-sm">
              {program.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Program Details</CardTitle>
            <CardDescription>Overview of the certification program</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900">Description</h3>
              <p className="mt-2 text-gray-600 leading-relaxed">
                {program.description || "No description provided."}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900">Requirements</h3>
              <p className="mt-2 text-gray-600 leading-relaxed">
                {program.requirements || "No specific requirements."}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900">Certificate Template</h3>
              <p className="mt-2 text-gray-600 capitalize flex items-center">
                <span className="inline-block w-4 h-4 rounded-full bg-blue-100 mr-2"></span>
                {program.certificate_template}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900">Report Submission</h3>
              <p className="mt-2 text-gray-600">
                {program.report_submission_method === "daily"
                  ? "Daily (after each lesson)"
                  : "Once at end of program"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900">CBT Questions</h3>
                <p className="mt-2 text-gray-600">{program.questions_count ?? 20} questions</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Test Duration</h3>
                <p className="mt-2 text-gray-600">{program.test_duration_minutes ?? 60} minutes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Program Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Duration</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {program.duration_months} {program.duration_months === 1 ? "month" : "months"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Enrolled Employees</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">{enrollmentCount}</dd>
                </div>
                <div className="pt-4 border-t">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    {program.is_active ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active for Enrollment
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Enrollment Paused
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </CardContent>
                    </Card>
        </div>
      </div>

      <div className="mt-8">
        <EnrollEmployees
          program={{
            id: program.id,
            name: program.name,
            description: program.description
          }}
        />
      </div>
    </div>
  )
}