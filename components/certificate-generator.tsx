"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { CertificateTemplate } from "./certificate-template"
import { Download, FileText, Loader2 } from "lucide-react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface CertificateData {
  certificateNumber: string
  verificationCode: string
  employeeName: string
  programName: string
  organizationName: string
  issuedDate: string
}

interface CertificateGeneratorProps {
  employeeId: string
  programId: string
  onCertificateGenerated?: (certificate: CertificateData) => void
}

export function CertificateGenerator({ employeeId, programId, onCertificateGenerated }: CertificateGeneratorProps) {
  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [certificate, setCertificate] = useState<CertificateData | null>(null)
  const certificateRef = useRef<HTMLDivElement>(null)

  const generateCertificate = async () => {
    setGenerating(true)
    try {
      const response = await fetch("/api/generate-certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, programId }),
      })

      if (!response.ok) throw new Error("Failed to generate certificate")

      const data = await response.json()
      setCertificate(data.certificate)
      onCertificateGenerated?.(data.certificate)
    } catch (error) {
      console.error("Error generating certificate:", error)
      alert("Failed to generate certificate. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  const downloadCertificate = async () => {
    if (!certificate || !certificateRef.current) return

    setDownloading(true)
    try {
      // Wait for fonts to load
      await document.fonts.ready

      const canvas = await html2canvas(certificateRef.current, {
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
      pdf.save(`Certificate-${certificate.certificateNumber}.pdf`)
    } catch (error) {
      console.error("Error downloading certificate:", error)
      alert("Failed to download certificate. Please try again.")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      {!certificate ? (
        <Button onClick={generateCertificate} disabled={generating}>
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Certificate...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Generate Certificate
            </>
          )}
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={downloadCertificate} disabled={downloading}>
              {downloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setCertificate(null)}>
              Generate New
            </Button>
          </div>

          {/* Certificate Preview */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Certificate Preview</h3>
            <div className="flex justify-center">
              <div className="transform scale-75 origin-top">
                <CertificateTemplate ref={certificateRef} data={certificate} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
