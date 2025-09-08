"use client"

import type React from "react"

import type { ReactElement } from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function NewReportPage({ params }: PageProps): ReactElement {
  const [programId, setProgramId] = useState<string>("")
  const [reportType, setReportType] = useState("")
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Get program ID from params
  params.then(({ id }) => setProgramId(id))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Submit report
      const { error } = await supabase.from("employee_reports").insert({
        employee_id: user.id,
        program_id: programId,
        report_type: reportType,
        content: content,
      })

      if (error) throw error

      router.push(`/dashboard/employee/programs/${programId}?tab=reports`)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href={`/dashboard/employee/programs/${programId}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Program
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Submit Report</h1>
        <p className="text-gray-600">Share your progress and insights with your organization</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
          <CardDescription>Provide information about your certification progress</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="progress">Progress Report</SelectItem>
                  <SelectItem value="completion">Completion Report</SelectItem>
                  <SelectItem value="assessment">Assessment Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Report Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe your progress, challenges, achievements, or any other relevant information..."
                rows={8}
                required
              />
              <p className="text-sm text-gray-500">
                Be detailed and specific about your learning experience, skills gained, and any challenges faced.
              </p>
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

            <div className="flex space-x-4">
              <Button type="submit" disabled={isLoading || !reportType}>
                {isLoading ? "Submitting..." : "Submit Report"}
              </Button>
              <Link href={`/dashboard/employee/programs/${programId}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
