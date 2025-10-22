"use client";

import { useState } from "react";
import Image from "next/image";

const templates = [
  {
    id: "classic",
    name: "Classic Red Border",
    description: "Elegant design with gold accents and red border",
    preview: "/certificate-templates/classic.png",
  },
  {
    id: "modern",
    name: "Modern Blue",
    description: "Contemporary design with blue gradient",
    preview: "/certificate-templates/modern.png",
  },
  {
    id: "minimal",
    name: "Minimalist Gold",
    description: "Clean design with gold accents",
    preview: "/certificate-templates/minimal.png",
  },
];

export function CertificatePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Certificate Template
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => onChange(template.id)}
            className={`relative rounded-lg border-2 cursor-pointer transition-all ${
              value === template.id ? "border-blue-500 shadow-lg" : "border-gray-200 hover:border-blue-200"
            }`}
          >
            <div className="p-4">
              <div className="aspect-[1.414] relative rounded overflow-hidden mb-4">
                <Image
                  src={template.preview}
                  alt={template.name}
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="font-medium text-gray-900">{template.name}</h3>
              <p className="text-sm text-gray-500">{template.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
