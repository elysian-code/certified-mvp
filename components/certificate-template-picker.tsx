import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import React from "react"
import { ClassicCertificatePreview, ModernCertificatePreview, MinimalCertificatePreview } from "./certificate-template-previews"

type Template = {
  id: string
  name: string
  description: string
  Preview: React.ComponentType
}

export function CertificateTemplatePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (id: string) => void
}) {
  const templates: Template[] = [
    {
      id: "classic",
      name: "Classic",
      description: "Elegant bordered certificate for formal achievements.",
      Preview: ClassicCertificatePreview,
    },
    {
      id: "modern",
      name: "Modern",
      description: "Contemporary design for digital credentials.",
      Preview: ModernCertificatePreview,
    },
    {
      id: "minimal",
      name: "Minimal",
      description: "Clean, simple style for universal use.",
      Preview: MinimalCertificatePreview,
    },
  ]

  return (
    <div>
      <label className="block font-semibold mb-3">Certificate Template</label>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {templates.map((t) => {
          const Selected = value === t.id
          const Preview = t.Preview
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={`flex flex-col items-center p-3 rounded-lg transition-shadow border ${
                Selected ? "border-blue-600 shadow-lg" : "border-gray-200 hover:shadow-md"
              } bg-white`}
              aria-pressed={Selected}
              aria-label={`Select ${t.name} template`}
            >
              <div className="w-full flex-1 mb-3" style={{ maxWidth: 340 }}>
                <div className="mx-auto" style={{ width: "100%" }}>
                  <div className="rounded-sm overflow-hidden border" style={{ boxShadow: "0 6px 18px rgba(0,0,0,0.06)" }}>
                    <div className="bg-gray-50" style={{ padding: 12, display: "flex", justifyContent: "center" }}>
                      <div style={{ width: "100%", maxWidth: 320 }}>
                        <Preview />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full text-center">
                <div className="font-medium text-sm">{t.name}</div>
                <div className="text-xs text-gray-500 mt-1">{t.description}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
