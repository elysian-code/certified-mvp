"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CertificateGenerator } from "@/components/certificate-generator"
import { User, Award, BookOpen, FileText, Calendar } from "lucide-react"

interface Employee {
  id: string
  full_name: string
  email: string
  created_at: string
}

interface Program {
  id: string
  name: string
  status: string
  enrollment_date: string
  completion_date: string | null
  progress_percentage: number
}

interface Certificate {
  id: string
  certificate_number: string
  issued_date: string
  status: string
  program_name: string
}

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [programs, setPrograms] = useState<Program[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchEmployeeData()
  }, [params.id])

  const fetchEmployeeData = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Fetch employee details
      const { data: employeeData } = await supabase
        .from("profiles")
        .select("id, full_name, email, created_at")
        .eq("id", params.id)
        .single()

      if (employeeData) {
        setEmployee(employeeData)
      }

      // Fetch employee programs
      const { data: programsData } = await supabase
        .from("employee_progress")
        .select(`
          *,
          certification_programs(id, name)
        `)
        .eq("employee_id", params.id)

      if (programsData) {
        const formattedPrograms = programsData.map((p) => ({
          id: p.certification_programs.id,
          name: p.certification_programs.name,
          status: p.status,
          enrollment_date: p.enrollment_date,
          completion_date: p.completion_date,
          progress_percentage: p.progress_percentage,
        }))
        setPrograms(formattedPrograms)
      }

      // Fetch employee certificates
      const { data: certificatesData } = await supabase
        .from("certificates")
        .select(`
          *,
          certification_programs(name)
        `)
        .eq("employee_id", params.id)

      if (certificatesData) {
        const formattedCertificates = certificatesData.map((c) => ({
          id: c.id,
          certificate_number: c.certificate_number,
          issued_date: c.issued_date,
          status: c.status,
          program_name: c.certification_programs.name,
        }))
        setCertificates(formattedCertificates)
      }
    } catch (error) {
      console.error("Error fetching employee data:", error)
    } finally {
      setLoading(false)
    }
  }

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

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading employee details...</div>
  }

  if (!employee) {
    return <div className="text-center">Employee not found</div>
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
                          onCertificateGenerated={() => fetchEmployeeData()}
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
