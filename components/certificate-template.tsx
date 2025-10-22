"use client"


import React from "react"
import { QRCodeSVG } from "qrcode.react"

export type CertificateTemplateProps = {
  template: "classic" | "modern" | "minimal"
  learnerName: string
  programTitle: string
  completionDate: string
  certificateId: string
  organizationName: string
  verificationUrl: string
}

export function CertificateTemplate({
  template,
  learnerName,
  programTitle,
  completionDate,
  certificateId,
  organizationName,
  verificationUrl,
}: CertificateTemplateProps) {
  switch (template) {
    case "classic":
      return (
        <div className="border-4 border-yellow-700 p-8 bg-white rounded-xl w-[800px] h-[600px] flex flex-col justify-between shadow-lg">
          <div>
            <h2 className="text-4xl font-serif font-bold text-center text-yellow-800 mb-2">Certificate of Completion</h2>
            <p className="text-lg text-center mb-4">This certifies that</p>
            <p className="text-3xl font-semibold text-center text-gray-900 mb-2">{learnerName}</p>
            <p className="text-center mb-4">has successfully completed the program</p>
            <p className="text-2xl font-bold text-center text-blue-700 mb-2">{programTitle}</p>
            <p className="text-center text-gray-700">as administered by <span className="font-semibold">{organizationName}</span></p>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm">Date: {completionDate}</p>
              <p className="text-sm">Certificate ID: {certificateId}</p>
            </div>
            <QRCodeSVG value={verificationUrl} size={64} />
          </div>
        </div>
      )
    case "modern":
      return (
        <div className="bg-gradient-to-r from-blue-100 to-blue-300 p-8 rounded-2xl w-[800px] h-[600px] flex flex-col justify-between shadow-xl">
          <div>
            <h2 className="text-4xl font-bold text-center text-blue-900 mb-2">CERTIFICATE</h2>
            <p className="text-lg text-center mb-4">Awarded to</p>
            <p className="text-3xl font-bold text-center text-gray-900 mb-2">{learnerName}</p>
            <p className="text-center mb-4">for completing</p>
            <p className="text-2xl font-semibold text-center text-blue-800 mb-2">{programTitle}</p>
            <p className="text-center text-gray-700">as administered by <span className="font-semibold">{organizationName}</span></p>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm">Date: {completionDate}</p>
              <p className="text-sm">ID: {certificateId}</p>
            </div>
            <QRCodeSVG value={verificationUrl} size={64} />
          </div>
        </div>
      )
    case "minimal":
      return (
        <div className="border border-gray-300 p-8 bg-white rounded-lg w-[800px] h-[600px] flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-medium text-center text-gray-700 mb-2">Certificate</h2>
            <p className="text-center mb-4">{learnerName}</p>
            <p className="text-center mb-2">Program: {programTitle}</p>
            <p className="text-center text-gray-700">Organization: <span className="font-semibold">{organizationName}</span></p>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs">Date: {completionDate}</p>
              <p className="text-xs">ID: {certificateId}</p>
            </div>
            <QRCodeSVG value={verificationUrl} size={48} />
          </div>
        </div>
      )
    default:
      return null
  }
}
