"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CertificatePicker } from "@/components/certificate-picker"

interface FormData {
  name: string
  description: string
  requirements: string
  durationMonths: string
  template: string
  isActive: boolean
  reportSubmissionMethod: string
  testDurationMinutes: string
  questionsCount: string
}

export default function NewProgramPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    requirements: "",
    durationMonths: "",
    template: "classic",
    isActive: true,
    reportSubmissionMethod: "end",
    testDurationMinutes: "60",
    questionsCount: "20"
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate form data
    if (!formData.name.trim()) {
      setError("Program name is required")
      setIsLoading(false)
      return
    }

    if (!formData.durationMonths || Number(formData.durationMonths) <= 0) {
      setError("Please enter a valid duration")
      setIsLoading(false)
      return
    }

    try {
      // Get current user and organization
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error(authError?.message || "Not authenticated")
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id, role")
        .eq("id", user.id)
        .single()

      if (profileError || !profile?.organization_id) {
        throw new Error(profileError?.message || "Organization not found")
      }

      if (profile.role !== "organization_admin") {
        throw new Error("Unauthorized: Only organization admins can create programs")
      }

      // Create program
      // Prepare program data
      const programData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        requirements: formData.requirements?.trim() || null,
        duration_months: Number(formData.durationMonths),
        is_active: formData.isActive,
        certificate_template: formData.template || 'classic',
        organization_id: profile.organization_id,
        report_submission_method: formData.reportSubmissionMethod || 'end',
        test_duration_minutes: Number(formData.testDurationMinutes) || 60,
        questions_count: Number(formData.questionsCount) || 20
      }

      const { data: newProgram, error: insertError } = await supabase
        .from("certification_programs")
        .insert(programData)
        .select()
        .single()

      if (insertError) {
        if (insertError.code === "23505") {
          throw new Error("A program with this name already exists")
        }
        throw new Error(insertError.message || "Failed to create program")
      }

      if (!newProgram) {
        throw new Error("Failed to retrieve the created program")
      }

      // Ensure data is revalidated and navigate to the new program's page
      router.refresh() // Revalidate the data
      router.push(`/dashboard/organization/programs/${newProgram.id}`)
    } catch (error) {
      console.error("Error creating program:", error)
      setError(
        error instanceof Error 
          ? error.message 
          : "Failed to create program. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href="/dashboard/organization/programs"
          className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Programs
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create New Program</h1>
        <p className="text-gray-600">Set up a new certification program for your organization</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Program Details</CardTitle>
          <CardDescription>Provide the basic information for your certification program</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <CertificatePicker
              value={formData.template}
              onChange={(template) => setFormData(prev => ({ ...prev, template }))}
            />

            <div className="space-y-2">
              <Label htmlFor="name">Program Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleChange("name")}
                placeholder="e.g., Cloud Architecture Certification"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={handleChange("description")}
                placeholder="Describe what this certification program covers..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={handleChange("requirements")}
                placeholder="List the prerequisites and requirements for this program..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (months)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.durationMonths}
                onChange={handleChange("durationMonths")}
                placeholder="6"
                min="1"
                max="60"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportMethod">Report Submission Method</Label>
              <Select
                value={formData.reportSubmissionMethod}
                onValueChange={(value) => setFormData(prev => ({ ...prev, reportSubmissionMethod: value }))}
              >
                <SelectTrigger id="reportMethod">
                  <SelectValue placeholder="Select report method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily (after each lesson)</SelectItem>
                  <SelectItem value="end">Once at end of program</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="questionsCount">Number of CBT Questions</Label>
                <Select
                  value={formData.questionsCount}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, questionsCount: value }))}
                >
                  <SelectTrigger id="questionsCount">
                    <SelectValue placeholder="Select question count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 Questions</SelectItem>
                    <SelectItem value="20">20 Questions</SelectItem>
                    <SelectItem value="30">30 Questions</SelectItem>
                    <SelectItem value="50">50 Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="testDuration">Test Duration (minutes)</Label>
                <Input
                  id="testDuration"
                  type="number"
                  value={formData.testDurationMinutes}
                  onChange={handleChange("testDurationMinutes")}
                  placeholder="60"
                  min="10"
                  max="300"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="active">Active (employees can enroll)</Label>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-4 rounded-lg flex items-start">
                <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="flex space-x-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Program"}
              </Button>
              <Link href="/dashboard/organization/programs">
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
