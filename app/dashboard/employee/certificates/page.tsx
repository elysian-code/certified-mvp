"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CertificateTemplate } from "@/components/certificate-template"
import { Award, Download, Calendar, Shield, Loader2, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { useRef } from "react"

interface Certificate {
  id: string
  certificate_number: string
  issued_date: string
  expiry_date: string | null
  status: string
  verification_code: string
  program: {
    name: string
    description: string
  }
}

interface Profile {
  id: string
  full_name: string
  role: string
  organization: {
    name: string
  }
}

export default function EmployeeCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const certificateRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchCertificates()
  }, [])

  const fetchCertificates = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Get user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select(`
          *,
          organization:organizations(name)
        `)
        .eq("id", user.user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      // Get employee certificates
      const { data: certificatesData } = await supabase
        .from("certificates")
        .select(`
          *,
          program:certification_programs(name, description)
        `)
        .eq("employee_id", user.user.id)
        .order("issued_date", { ascending: false })

      if (certificatesData) {
        setCertificates(certificatesData)
      }
    } catch (error) {
      console.error("Error fetching certificates:", error)
    } finally {
      setLoading(false)
    }
  }

  const downloadCertificate = async (certificate: Certificate) => {
    if (!profile) return

    setDownloading(certificate.id)
    try {
      // Wait for fonts to load
      await document.fonts.ready

      const canvas = await html2canvas(certificateRef.current!, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 800,
        height: 600,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [800, 600],
      })

      pdf.addImage(imgData, "PNG", 0, 0, 800, 600)
      pdf.save(`Certificate-${certificate.certificate_number}.pdf`)
    } catch (error) {
      console.error("Error downloading certificate:", error)
      alert("Failed to download certificate. Please try again.")
    } finally {
      setDownloading(null)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading certificates...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Certificates</h1>
        <p className="text-gray-600">View and download your earned certificates</p>
      </div>

      {certificates && certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((certificate) => (
            <Card key={certificate.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <Award className="h-8 w-8 text-yellow-500 mr-3" />
                    <div>
                      <CardTitle className="text-lg">{certificate.program?.name}</CardTitle>
                      <CardDescription>Certificate #{certificate.certificate_number}</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={
                      certificate.status === "active"
                        ? "default"
                        : certificate.status === "expired"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {certificate.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Issued: {new Date(certificate.issued_date).toLocaleDateString()}
                    </div>
                    {certificate.expiry_date && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Expires: {new Date(certificate.expiry_date).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Verification: {certificate.verification_code}
                    </div>
                  </div>

                  {certificate.program?.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{certificate.program.description}</p>
                  )}

                  <div className="flex space-x-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => downloadCertificate(certificate)}
                      disabled={downloading === certificate.id}
                    >
                      {downloading === certificate.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </>
                      )}
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle>Certificate Preview</DialogTitle>
                        </DialogHeader>
                        <div className="flex justify-center p-4">
                          <div className="transform scale-90 origin-top">
                            <CertificateTemplate
                              ref={certificateRef}
                              data={{
                                certificateNumber: certificate.certificate_number,
                                verificationCode: certificate.verification_code,
                                employeeName: profile?.full_name || "",
                                programName: certificate.program?.name || "",
                                organizationName: profile?.organization?.name || "",
                                issuedDate: certificate.issued_date,
                              }}
                            />
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Award className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates yet</h3>
            <p className="text-gray-600 mb-6">Complete a certification program to earn your first certificate.</p>
            <Button>
              <a href="/dashboard/employee/programs">Browse Programs</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Hidden certificate template for PDF generation */}
      <div className="fixed -top-[9999px] -left-[9999px]">
        {certificates.map((certificate) => (
          <div key={`hidden-${certificate.id}`}>
            <CertificateTemplate
              ref={downloading === certificate.id ? certificateRef : undefined}
              data={{
                certificateNumber: certificate.certificate_number,
                verificationCode: certificate.verification_code,
                employeeName: profile?.full_name || "",
                programName: certificate.program?.name || "",
                organizationName: profile?.organization?.name || "",
                issuedDate: certificate.issued_date,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
