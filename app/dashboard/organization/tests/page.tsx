"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Play, Users, Clock, Target } from "lucide-react"
import Link from "next/link"

interface CBTTest {
  id: string
  name: string
  description: string
  passing_score: number
  time_limit_minutes: number
  is_active: boolean
  program_name: string
  question_count: number
  attempt_count: number
}

export default function TestsPage() {
  const [tests, setTests] = useState<CBTTest[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchTests()
  }, [])

  const fetchTests = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.user.id)
        .single()

      if (!profile) return

      const { data, error } = await supabase
        .from("cbt_tests")
        .select(`
          *,
          certification_programs!inner(name, organization_id),
          cbt_questions(count),
          test_attempts(count)
        `)
        .eq("certification_programs.organization_id", profile.organization_id)

      if (error) throw error

      const formattedTests =
        data?.map((test) => ({
          id: test.id,
          name: test.name,
          description: test.description,
          passing_score: test.passing_score,
          time_limit_minutes: test.time_limit_minutes,
          is_active: test.is_active,
          program_name: test.certification_programs.name,
          question_count: test.cbt_questions?.length || 0,
          attempt_count: test.test_attempts?.length || 0,
        })) || []

      setTests(formattedTests)
    } catch (error) {
      console.error("Error fetching tests:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading tests...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CBT Tests</h1>
          <p className="text-muted-foreground">Manage computer-based tests for your certification programs</p>
        </div>
        <Link href="/dashboard/organization/tests/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Test
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {tests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tests created yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first CBT test to start assessing your employees
              </p>
              <Link href="/dashboard/organization/tests/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Test
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          tests.map((test) => (
            <Card key={test.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {test.name}
                      <Badge variant={test.is_active ? "default" : "secondary"}>
                        {test.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{test.description}</CardDescription>
                    <p className="text-sm text-muted-foreground mt-1">Program: {test.program_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/organization/tests/${test.id}`}>
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span>Passing: {test.passing_score}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{test.time_limit_minutes ? `${test.time_limit_minutes} min` : "No limit"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{test.question_count} questions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-muted-foreground" />
                    <span>{test.attempt_count} attempts</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
