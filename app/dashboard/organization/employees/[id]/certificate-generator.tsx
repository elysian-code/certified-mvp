"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Award, FileText, Download } from "lucide-react"
import { CertificateGenerator } from "@/components/certificate-generator"

interface CompletedProgram {
  id: string
  name: string
  completion_date: string | null
}

interface CertificateGeneratorTabProps {
  employeeId: string
  programs: CompletedProgram[]
}

export default function CertificateGeneratorTab({ employeeId, programs }: CertificateGeneratorTabProps) {
  const [generatingCertificate, setGeneratingCertificate] = useState<string | null>(null)
  const completedPrograms = programs.filter((p) => p.completion_date)

  const handleCertificateGenerated = () => {
    setGeneratingCertificate(null)
  }

  if (completedPrograms.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No completed programs</h3>
            <p className="text-gray-600">
              Employee must complete a certification program before generating a certificate.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Generate Certificate</CardTitle>
          <CardDescription>Generate and download certificates for completed programs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {completedPrograms.map((program) => (
              <div
                key={program.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-medium mb-1">{program.name}</h4>
                    <p className="text-sm text-gray-600">
                      Completed on {new Date(program.completion_date!).toLocaleDateString()}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setGeneratingCertificate(program.id)}
                    disabled={generatingCertificate === program.id}
                  >
                    {generatingCertificate === program.id ? (
                      <>
                        <Award className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Generate Certificate
                      </>
                    )}
                  </Button>
                </div>
                {generatingCertificate === program.id && (
                  <CertificateGenerator
                    employeeId={employeeId}
                    programId={program.id}
                    onCertificateGenerated={handleCertificateGenerated}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}