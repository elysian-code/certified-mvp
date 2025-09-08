"use client"

import { forwardRef } from "react"

interface CertificateData {
  certificateNumber: string
  verificationCode: string
  employeeName: string
  programName: string
  organizationName: string
  issuedDate: string
}

interface CertificateTemplateProps {
  data: CertificateData
}

export const CertificateTemplate = forwardRef<HTMLDivElement, CertificateTemplateProps>(({ data }, ref) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div
      ref={ref}
      className="w-[800px] h-[600px] bg-white border-8 border-blue-800 relative overflow-hidden print:border-blue-800"
      style={{ fontFamily: "serif" }}
    >
      {/* Decorative border */}
      <div className="absolute inset-4 border-2 border-blue-600"></div>

      {/* Header */}
      <div className="text-center pt-12 pb-8">
        <h1 className="text-4xl font-bold text-blue-800 mb-2">CERTIFICATE OF COMPLETION</h1>
        <div className="w-32 h-1 bg-blue-600 mx-auto"></div>
      </div>

      {/* Content */}
      <div className="px-16 text-center space-y-6">
        <p className="text-lg text-gray-700">This is to certify that</p>

        <h2 className="text-3xl font-bold text-gray-900 border-b-2 border-blue-600 pb-2 inline-block">
          {data.employeeName}
        </h2>

        <p className="text-lg text-gray-700">has successfully completed the certification program</p>

        <h3 className="text-2xl font-semibold text-blue-800 py-4">{data.programName}</h3>

        <p className="text-lg text-gray-700">
          as administered by <span className="font-semibold">{data.organizationName}</span>
        </p>

        <div className="pt-8 pb-4">
          <p className="text-base text-gray-600">Issued on {formatDate(data.issuedDate)}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-16 right-16 flex justify-between items-end">
        <div className="text-center">
          <div className="w-48 border-t border-gray-400 pt-2">
            <p className="text-sm text-gray-600">Authorized Signature</p>
          </div>
        </div>

        <div className="text-center">
          <div className="bg-blue-50 p-3 rounded border">
            <p className="text-xs text-gray-600 mb-1">Certificate Number</p>
            <p className="text-sm font-mono font-bold">{data.certificateNumber}</p>
            <p className="text-xs text-gray-600 mt-1">Verification Code</p>
            <p className="text-sm font-mono font-bold">{data.verificationCode}</p>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-8 left-8 w-16 h-16 border-4 border-blue-200 rounded-full opacity-20"></div>
      <div className="absolute top-8 right-8 w-16 h-16 border-4 border-blue-200 rounded-full opacity-20"></div>
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-blue-600"></div>
    </div>
  )
})

CertificateTemplate.displayName = "CertificateTemplate"
