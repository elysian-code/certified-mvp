"use client"

import { useState } from "react"
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

interface ProgramData {
  id: string
  name: string
  description: string | null
  requirements: string | null
  duration_months: number
  is_active: boolean
  certificate_template: string
  organization_id: string
  report_submission_method: string
  test_duration_minutes: number
  questions_count: number
}

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

interface EditProgramFormProps {
  program: ProgramData
}

export function EditProgramForm({ program }: EditProgramFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: program.name,
    description: program.description || "",
    requirements: program.requirements || "",
    durationMonths: program.duration_months.toString(),
    template: program.certificate_template,
    isActive: program.is_active,
    reportSubmissionMethod: program.report_submission_method || "end",
    testDurationMinutes: (program.test_duration_minutes || 60).toString(),
    questionsCount: (program.questions_count || 20).toString()
  })

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
      const supabase = createClient()
      
      // Get current user and check authorization
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
        throw new Error("Unauthorized: Only organization admins can edit programs")
      }

      // Update program
      const programData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        requirements: formData.requirements?.trim() || null,
        duration_months: Number(formData.durationMonths),
        is_active: formData.isActive,
        certificate_template: formData.template || 'classic',
        report_submission_method: formData.reportSubmissionMethod || 'end',
        test_duration_minutes: Number(formData.testDurationMinutes) || 60,
        questions_count: Number(formData.questionsCount) || 20
      }

      const { error: updateError } = await supabase
        .from("certification_programs")
        .update(programData)
        .eq("id", program.id)
        .eq("organization_id", profile.organization_id)

      if (updateError) {
        throw new Error(updateError.message || "Failed to update program")
      }

      router.refresh()
      router.push(`/dashboard/organization/programs/${program.id}`)
    } catch (error) {
      console.error("Error updating program:", error)
      setError(
        error instanceof Error 
          ? error.message 
          : "Failed to update program. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href={`/dashboard/organization/programs/${program.id}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Program
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Program</h1>
        <p className="mt-2 text-gray-600">Update your certification program details</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Program Details</CardTitle>
          <CardDescription>Modify the information for your certification program</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
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

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Program"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}