"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, Trash2 } from "lucide-react"

interface Program {
  id: string
  name: string
}

interface Question {
  question_text: string
  question_type: "multiple_choice" | "true_false" | "short_answer"
  options?: string[]
  correct_answer: string
  explanation: string
}

export default function NewTestPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    program_id: "",
    passing_score: 70,
    time_limit_minutes: 60,
  })

  const [aiSettings, setAiSettings] = useState({
    topic: "",
    difficulty: "intermediate",
    questionCount: 10,
    questionType: "multiple_choice",
  })

  useEffect(() => {
    fetchPrograms()
  }, [])

  const fetchPrograms = async () => {
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
        .from("certification_programs")
        .select("id, name")
        .eq("organization_id", profile.organization_id)
        .eq("is_active", true)

      if (error) throw error
      setPrograms(data || [])
    } catch (error) {
      console.error("Error fetching programs:", error)
    }
  }

  const generateQuestions = async () => {
    if (!aiSettings.topic.trim()) return

    setGenerating(true)
    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiSettings),
      })

      if (!response.ok) throw new Error("Failed to generate questions")

      const data = await response.json()
      setQuestions(data.questions)
    } catch (error) {
      console.error("Error generating questions:", error)
      alert("Failed to generate questions. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  const createTest = async () => {
    if (!formData.name || !formData.program_id || questions.length === 0) {
      alert("Please fill in all required fields and generate questions")
      return
    }

    setLoading(true)
    try {
      // Create the test
      const { data: test, error: testError } = await supabase
        .from("cbt_tests")
        .insert({
          name: formData.name,
          description: formData.description,
          program_id: formData.program_id,
          passing_score: formData.passing_score,
          time_limit_minutes: formData.time_limit_minutes,
        })
        .select()
        .single()

      if (testError) throw testError

      // Insert questions
      const questionsToInsert = questions.map((q) => ({
        test_id: test.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options ? JSON.stringify(q.options) : null,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
      }))

      const { error: questionsError } = await supabase.from("cbt_questions").insert(questionsToInsert)

      if (questionsError) throw questionsError

      router.push("/dashboard/organization/tests")
    } catch (error) {
      console.error("Error creating test:", error)
      alert("Failed to create test. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create CBT Test</h1>
        <p className="text-muted-foreground">Create a new computer-based test with AI-generated questions</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Test Details */}
        <Card>
          <CardHeader>
            <CardTitle>Test Details</CardTitle>
            <CardDescription>Basic information about your test</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Test Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Safety Certification Test"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the test"
              />
            </div>

            <div>
              <Label htmlFor="program">Certification Program *</Label>
              <Select
                value={formData.program_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, program_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="passing_score">Passing Score (%)</Label>
                <Input
                  id="passing_score"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.passing_score}
                  onChange={(e) => setFormData((prev) => ({ ...prev, passing_score: Number.parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="time_limit">Time Limit (minutes)</Label>
                <Input
                  id="time_limit"
                  type="number"
                  min="1"
                  value={formData.time_limit_minutes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, time_limit_minutes: Number.parseInt(e.target.value) }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Question Generation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Question Generation
            </CardTitle>
            <CardDescription>Generate questions automatically using AI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="topic">Topic/Subject *</Label>
              <Input
                id="topic"
                value={aiSettings.topic}
                onChange={(e) => setAiSettings((prev) => ({ ...prev, topic: e.target.value }))}
                placeholder="e.g., Workplace Safety, Data Privacy"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={aiSettings.difficulty}
                  onValueChange={(value) => setAiSettings((prev) => ({ ...prev, difficulty: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="questionCount">Question Count</Label>
                <Input
                  id="questionCount"
                  type="number"
                  min="5"
                  max="50"
                  value={aiSettings.questionCount}
                  onChange={(e) =>
                    setAiSettings((prev) => ({ ...prev, questionCount: Number.parseInt(e.target.value) }))
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="questionType">Question Type</Label>
              <Select
                value={aiSettings.questionType}
                onValueChange={(value) => setAiSettings((prev) => ({ ...prev, questionType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  <SelectItem value="true_false">True/False</SelectItem>
                  <SelectItem value="short_answer">Short Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={generateQuestions} disabled={generating || !aiSettings.topic.trim()} className="w-full">
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Questions
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Generated Questions */}
      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Questions ({questions.length})</CardTitle>
            <CardDescription>Review and edit the AI-generated questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Question {index + 1}</Badge>
                      <Badge variant="secondary">{question.question_type.replace("_", " ")}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label>Question</Label>
                      <p className="text-sm mt-1">{question.question_text}</p>
                    </div>

                    {question.options && (
                      <div>
                        <Label>Options</Label>
                        <ul className="text-sm mt-1 space-y-1">
                          {question.options.map((option, optIndex) => (
                            <li
                              key={optIndex}
                              className={`p-2 rounded ${option === question.correct_answer ? "bg-green-50 border border-green-200" : "bg-gray-50"}`}
                            >
                              {String.fromCharCode(65 + optIndex)}. {option}
                              {option === question.correct_answer && (
                                <Badge className="ml-2" variant="default">
                                  Correct
                                </Badge>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {question.question_type !== "multiple_choice" && (
                      <div>
                        <Label>Correct Answer</Label>
                        <p className="text-sm mt-1 p-2 bg-green-50 border border-green-200 rounded">
                          {question.correct_answer}
                        </p>
                      </div>
                    )}

                    <div>
                      <Label>Explanation</Label>
                      <p className="text-sm mt-1 text-muted-foreground">{question.explanation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={() => router.back()} variant="outline">
          Cancel
        </Button>
        <Button
          onClick={createTest}
          disabled={loading || !formData.name || !formData.program_id || questions.length === 0}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Test...
            </>
          ) : (
            "Create Test"
          )}
        </Button>
      </div>
    </div>
  )
}
