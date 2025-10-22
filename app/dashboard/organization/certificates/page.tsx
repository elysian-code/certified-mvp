"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Award, Eye, XCircle, RefreshCw } from "lucide-react"

export default function OrganizationCertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchCertificates()
  }, [])

  async function fetchCertificates() {
    setLoading(true)
    const { data, error } = await supabase
      .from("certificates")
      .select(`*, profiles!employee_id(full_name), certification_programs(name), organizations!organization_id(name)`)
      .order("issued_date", { ascending: false })
    setCertificates(data || [])
    setLoading(false)
  }

  async function revokeCertificate(id: string) {
    setLoading(true)
    await supabase.from("certificates").update({ status: "revoked" }).eq("id", id)
    await fetchCertificates()
    setLoading(false)
  }

  async function reissueCertificate(id: string) {
    setLoading(true)
    await supabase.from("certificates").update({ status: "active" }).eq("id", id)
    await fetchCertificates()
    setLoading(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Certificates</h1>
      <Card>
        <CardHeader>
          <CardTitle>Issued Certificates</CardTitle>
          <CardDescription>View, revoke, or re-issue certificates for your organization</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : certificates.length === 0 ? (
            <div className="text-gray-500">No certificates issued yet.</div>
          ) : (
            <div className="space-y-4">
              {certificates.map(cert => (
                <div key={cert.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <div className="flex gap-2 items-center">
                      <Award className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold">{cert.certification_programs?.name}</span>
                      <Badge variant={cert.status === "active" ? "default" : "destructive"}>{cert.status}</Badge>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Recipient: {cert.profiles?.full_name}</div>
                    <div className="text-xs text-gray-500">Issued: {new Date(cert.issued_date).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelected(cert)}>
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                    {cert.status === "active" ? (
                      <Button size="sm" variant="destructive" onClick={() => revokeCertificate(cert.id)}>
                        <XCircle className="h-4 w-4 mr-1" /> Revoke
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => reissueCertificate(cert.id)}>
                        <RefreshCw className="h-4 w-4 mr-1" /> Re-issue
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Certificate Details</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="space-y-4 mt-4">
              <div className="font-semibold text-lg">{selected.certification_programs?.name}</div>
              <div className="text-sm text-gray-600">Recipient: {selected.profiles?.full_name}</div>
              <div className="text-sm text-gray-600">Issued: {new Date(selected.issued_date).toLocaleDateString()}</div>
              <div className="text-sm text-gray-600">Certificate #: {selected.certificate_number}</div>
              <div className="text-sm text-gray-600">Verification Code: {selected.verification_code}</div>
              <div className="text-sm text-gray-600">Status: <Badge variant={selected.status === "active" ? "default" : "destructive"}>{selected.status}</Badge></div>
              <div className="mt-4">
                <Button asChild variant="outline">
                  <a href={`/verify?code=${selected.verification_code}`} target="_blank" rel="noopener noreferrer">
                    Verify Certificate
                  </a>
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
