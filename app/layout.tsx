
import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ErrorBoundary } from "@/components/error-boundary"
import { SupabaseProvider } from "@/components/providers/supabase-provider"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "Certified - Professional Certification Platform",
  description: "Manage and verify professional certifications with ease",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <ErrorBoundary>
          <SupabaseProvider>
            {children}
          </SupabaseProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
