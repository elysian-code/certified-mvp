"use client"

import { useState } from "react"
import { EmployeeSearch } from "@/components/employee-search"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, Mail, UserPlus } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Employee {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  role: string
}

interface Program {
  id: string
  name: string
  description: string | null
}

interface EnrollEmployeesProps {
  program: Program
  onSuccess?: () => void
}

export function EnrollEmployees({ program, onSuccess }: EnrollEmployeesProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleEnrollExisting = async () => {
    if (!selectedEmployee) return

    try {
      setLoading(true)
      setError("")
      setSuccess(false)
      
      const response = await fetch("/api/enroll-employee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: selectedEmployee.id,
          programId: program.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to enroll employee")
      }

      setSuccess(true)
      setSelectedEmployee(null)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enroll employee")
    } finally {
      setLoading(false)
    }
  }

  const handleSendInvite = async () => {
    if (!email || !fullName) return

    try {
      setLoading(true)
      setError("")
      setSuccess(false)
      
      const response = await fetch("/api/invite-employee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          fullName,
          programId: program.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to send invitation")
      }

      setSuccess(true)
      setEmail("")
      setFullName("")
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Employee to Program</CardTitle>
        <CardDescription>Enroll an existing employee or invite a new one by email</CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="existing" className="space-y-4">
          <TabsList>
            <TabsTrigger value="existing">Existing Employee</TabsTrigger>
            <TabsTrigger value="invite">Send Invitation</TabsTrigger>
          </TabsList>

          <TabsContent value="existing">
            <div className="space-y-4">
              <div>
                <Label>Search Employee</Label>
                <EmployeeSearch
                  onSelect={setSelectedEmployee}
                  className="mt-1.5"
                />
              </div>

              {selectedEmployee && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{selectedEmployee.full_name}</h4>
                        <p className="text-sm text-gray-500">{selectedEmployee.email}</p>
                      </div>
                      <Button
                        onClick={handleEnrollExisting}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Enrolling...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Enroll
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="invite">
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter employee's full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter employee's email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleSendInvite}
                  disabled={loading || !email || !fullName}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending Invitation...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                {selectedEmployee
                  ? "Employee enrolled successfully"
                  : "Invitation sent successfully"}
              </AlertDescription>
            </Alert>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}