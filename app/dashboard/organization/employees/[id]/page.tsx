import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  Building, 
  Award, 
  User,
  BookOpen,
  FileText
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { CertificateGenerator } from "@/components/certificate-generator"

interface Profile {
  role: string
  organization: {
    id: string
  }
}

interface Program {
  id: string
  name: string
  description: string | null
  status: string
  progress_percentage: number
  enrolled_at: string
  completed_at: string | null
}

interface Certificate {
  id: string
  certificate_number: string
  issued_date: string
  program_id: string
  program: {
    name: string
  }
  status: string
}

interface Employee {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  role: string
  created_at: string
  employee_progress: Array<{
    id: string
    status: string
    progress_percentage: number
    enrolled_at: string
    completed_at: string | null
    program: {
      id: string
      name: string
      description: string | null
    }
  }>
  certificates: Certificate[]
}

export const revalidate = 0 // Disable caching for this page

export default async function EmployeeDetailPage({ 
  params 
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

  // Get employee details with progress and certificates
  const { data: employeeData, error: employeeError } = await supabase
    .from("profiles")
    .select(`
      *,
      employee_progress(
        *,
        program:certification_programs(
          id,
          name,
          description
        )
      ),
      certificates(
        id,
        certificate_number,
        issued_date,
        program_id,
        status,
        program:certification_programs(
          name
        )
      )
    `)
    .eq("id", params.id)
    .eq("organization_id", profile.organization.id)
    .eq("role", "employee")
    .single() as { data: Employee | null; error: any }

  if (!employeeData || employeeError) {
    return notFound()
  }

  const employee = employeeData

  // Transform employee_progress and certificates for easier use
  const programs = employee.employee_progress.map(progress => ({
    id: progress.program.id,
    name: progress.program.name,
    description: progress.program.description,
    status: progress.status,
    progress_percentage: progress.progress_percentage,
    enrollment_date: progress.enrolled_at,
    completion_date: progress.completed_at
  }))

  const certificates = employee.certificates.map(cert => ({
    id: cert.id,
    certificate_number: cert.certificate_number,
    issued_date: cert.issued_date,
    program_id: cert.program_id,
    program_name: cert.program.name,
    status: cert.status
  }))

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "enrolled":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Employee Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">{employee.full_name}</CardTitle>
              <CardDescription>{employee.email}</CardDescription>
              <p className="text-sm text-muted-foreground mt-1">
                Member since {new Date(employee.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="programs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="programs" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Programs
          </TabsTrigger>
          <TabsTrigger value="certificates" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Certificates
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Generate Certificate
          </TabsTrigger>
        </TabsList>

        {/* Programs Tab */}
        <TabsContent value="programs" className="space-y-4">
          {programs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No programs enrolled</h3>
                <p className="text-muted-foreground text-center">
                  This employee hasn't been enrolled in any certification programs yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            programs.map((program) => (
              <Card key={program.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {program.name}
                        <Badge className={getStatusColor(program.status)}>{program.status}</Badge>
                      </CardTitle>
                      <CardDescription>
                        Enrolled on {new Date(program.enrollment_date).toLocaleDateString()}
                        {program.completion_date && (
                          <span> • Completed on {new Date(program.completion_date).toLocaleDateString()}</span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{program.progress_percentage}%</p>
                      <p className="text-sm text-muted-foreground">Progress</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates" className="space-y-4">
          {certificates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No certificates issued</h3>
                <p className="text-muted-foreground text-center">This employee hasn't received any certificates yet.</p>
              </CardContent>
            </Card>
          ) : (
            certificates.map((certificate) => (
              <Card key={certificate.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {certificate.program_name}
                        <Badge className={getStatusColor(certificate.status)}>{certificate.status}</Badge>
                      </CardTitle>
                      <CardDescription>Certificate #{certificate.certificate_number}</CardDescription>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Issued on {new Date(certificate.issued_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Generate Certificate Tab */}
        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Certificate</CardTitle>
              <CardDescription>Generate and download a certificate for completed programs</CardDescription>
            </CardHeader>
            <CardContent>
              {programs.filter((p) => p.status === "completed").length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No completed programs</h3>
                  <p className="text-muted-foreground">
                    Employee must complete a certification program before generating a certificate.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {programs
                    .filter((p) => p.status === "completed")
                    .map((program) => (
                      <div key={program.id} className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">{program.name}</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Completed on{" "}
                          {program.completion_date ? new Date(program.completion_date).toLocaleDateString() : "N/A"}
                        </p>
                        <CertificateGenerator
                          employeeId={employee.id}
                          programId={program.id}
                          // The CertificateGenerator component will handle its own revalidation
                          onCertificateGenerated={() => {}}
                        />
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
