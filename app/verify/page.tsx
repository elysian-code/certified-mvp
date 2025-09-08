"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, Shield, Award, Calendar, Building, User, CheckCircle, XCircle } from "lucide-react"

interface CertificateVerification {
  certificate_number: string
  verification_code: string
  issued_date: string
  expiry_date: string | null
  status: string
  employee_name: string
  program_name: string
  organization_name: string
}

export default function VerifyPage() {
  const [verificationCode, setVerificationCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [certificate, setCertificate] = useState<CertificateVerification | null>(null)
  const [error, setError] = useState("")
  const supabase = createClient()

  const verifyCertificate = async () => {
    if (!verificationCode.trim()) {
      setError("Please enter a verification code")
      return
    }

    setLoading(true)
    setError("")
    setCertificate(null)

    try {
      const { data, error: queryError } = await supabase
        .from("certificates")
        .select(`
          certificate_number,
          verification_code,
          issued_date,
          expiry_date,
          status,
          profiles!employee_id(full_name),
          certification_programs!program_id(name),
          organizations!organization_id(name)
        `)
        .eq("verification_code", verificationCode.toUpperCase())
        .single()

      if (queryError || !data) {
        setError("Certificate not found. Please check the verification code and try again.")
        return
      }

      setCertificate({
        certificate_number: data.certificate_number,
        verification_code: data.verification_code,
        issued_date: data.issued_date,
        expiry_date: data.expiry_date,
        status: data.status,
        employee_name: data.profiles.full_name,
        program_name: data.certification_programs.name,
        organization_name: data.organizations.name,
      })
    } catch (error) {
      console.error("Error verifying certificate:", error)
      setError("An error occurred while verifying the certificate. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const isExpired = certificate?.expiry_date && new Date(certificate.expiry_date) < new Date()
  const isValid = certificate?.status === "active" && !isExpired

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Certificate Verification</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Verify the authenticity of professional certificates issued through our platform
          </p>
        </div>

        {/* Verification Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Verify Certificate
            </CardTitle>
            <CardDescription>
              Enter the verification code found on the certificate to check its authenticity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                placeholder="Enter verification code (e.g., ABC123DEF456)"
                className="font-mono"
                maxLength={12}
              />
            </div>
            <Button onClick={verifyCertificate} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Search className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Verify Certificate
                </>
              )}
            </Button>
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <XCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verification Results */}
        {certificate && (
          <Card className={`border-2 ${isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {isValid ? (
                    <>
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      Certificate Verified
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-red-600" />
                      Certificate Invalid
                    </>
                  )}
                </CardTitle>
                <Badge variant={isValid ? "default" : "destructive"} className={isValid ? "bg-green-600" : ""}>
                  {isValid ? "Valid" : isExpired ? "Expired" : certificate.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Certificate Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Program:</span>
                        <span>{certificate.program_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Recipient:</span>
                        <span>{certificate.employee_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Issued by:</span>
                        <span>{certificate.organization_name}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Verification Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Certificate #:</span>
                        <span className="font-mono">{certificate.certificate_number}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Issued:</span>
                        <span>{new Date(certificate.issued_date).toLocaleDateString()}</span>
                      </div>
                      {certificate.expiry_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Expires:</span>
                          <span className={isExpired ? "text-red-600 font-medium" : ""}>
                            {new Date(certificate.expiry_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {!isValid && (
                <div className="mt-6 p-4 bg-red-100 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">
                      {isExpired ? "This certificate has expired" : "This certificate is not currently valid"}
                    </span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">
                    Please contact the issuing organization for more information.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How to Verify</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Locate the Code</h3>
                <p className="text-gray-600">Find the verification code on the certificate document</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Enter the Code</h3>
                <p className="text-gray-600">Type the verification code in the field above</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">View Results</h3>
                <p className="text-gray-600">Get instant verification of the certificate's authenticity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
