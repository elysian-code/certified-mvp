"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, AlertCircle } from "lucide-react"

interface Question {
  id: string
  question_text: string
  question_type: "multiple_choice" | "true_false" | "short_answer"
  options: string[] | null
  correct_answer: string
}

interface TestData {
  id: string
  name: string
  description: string
  passing_score: number
  time_limit_minutes: number
  program_id: string
  questions: Question[]
}

function getGrade(score: number): string {
  if (score >= 90) return "excellent"
  if (score >= 80) return "good"
  if (score >= 70) return "pass"
  if (score >= 50) return "fair"
  return "fail"
}

export default function TakeTestPage({ params }: { params: { id: string } }) {
  const [test, setTest] = useState<TestData | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchTest()
  }, [params.id])

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          submitTest()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const fetchTest = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Check if already attempted (one-time only)
      const { data: existingAttempt } = await supabase
        .from("test_attempts")
        .select("id")
        .eq("employee_id", user.user.id)
        .eq("test_id", params.id)
        .single()

      if (existingAttempt) {
        router.replace(`/dashboard/employee/tests/${params.id}/results`)
        return
      }

      const { data, error } = await supabase
        .from("cbt_tests")
        .select(`
          *,
          cbt_questions(id, question_text, question_type, options, correct_answer)
        `)
        .eq("id", params.id)
        .single()

      if (error) throw error

      const testData: TestData = {
        id: data.id,
        name: data.name,
        description: data.description,
        passing_score: data.passing_score,
        time_limit_minutes: data.time_limit_minutes,
        program_id: data.program_id,
        questions: data.cbt_questions.map((q: any) => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options ? (Array.isArray(q.options) ? q.options : JSON.parse(q.options)) : null,
          correct_answer: q.correct_answer,
        })),
      }

      setTest(testData)
      if (testData.time_limit_minutes) {
        setTimeLeft(testData.time_limit_minutes * 60)
      }
    } catch (error) {
      console.error("Error fetching test:", error)
    } finally {
      setLoading(false)
    }
  }

  const submitTest = async () => {
    if (!test) return

    setSubmitting(true)
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Calculate score
      const totalQuestions = test.questions.length
      const correctCount = test.questions.filter(
        (q) => answers[q.id] !== undefined && answers[q.id] === q.correct_answer
      ).length
      const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
      const passed = score >= test.passing_score
      const grade = getGrade(score)

      const { error } = await supabase.from("test_attempts").insert({
        employee_id: user.user.id,
        test_id: test.id,
        answers: JSON.stringify(answers),
        score,
        passed,
        grade,
        completed_at: new Date().toISOString(),
      })

      if (error) throw error

      // If passed, update employee progress status to completed
      if (passed) {
        const { error: progressError } = await supabase
          .from("employee_progress")
          .update({ status: "completed", progress_percentage: 100, completion_date: new Date().toISOString().split("T")[0] })
          .eq("employee_id", user.user.id)
          .eq("program_id", test.program_id)
        if (progressError) {
          console.error("Failed to update employee progress:", progressError.message)
        }
      }

      router.push(`/dashboard/employee/tests/${test.id}/results`)
    } catch (error) {
      console.error("Error submitting test:", error)
      alert("Failed to submit test. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading test...</div>
  }

  if (!test) {
    return <div className="text-center">Test not found</div>
  }

  const progress = ((currentQuestion + 1) / test.questions.length) * 100
  const currentQ = test.questions[currentQuestion]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{test.name}</h1>
          <p className="text-muted-foreground">{test.description}</p>
        </div>
        {timeLeft !== null && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className={`font-mono ${timeLeft < 300 ? "text-red-500" : ""}`}>{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>
            Question {currentQuestion + 1} of {test.questions.length}
          </span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Question {currentQuestion + 1}
            <Badge variant="outline">{currentQ.question_type.replace("_", " ")}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg">{currentQ.question_text}</p>

          {/* Multiple Choice */}
          {currentQ.question_type === "multiple_choice" && currentQ.options && (
            <RadioGroup
              value={answers[currentQ.id] || ""}
              onValueChange={(value) => setAnswers((prev) => ({ ...prev, [currentQ.id]: value }))}
            >
              {currentQ.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {String.fromCharCode(65 + index)}. {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {/* True/False */}
          {currentQ.question_type === "true_false" && (
            <RadioGroup
              value={answers[currentQ.id] || ""}
              onValueChange={(value) => setAnswers((prev) => ({ ...prev, [currentQ.id]: value }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="True" id="true" />
                <Label htmlFor="true" className="cursor-pointer">
                  True
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="False" id="false" />
                <Label htmlFor="false" className="cursor-pointer">
                  False
                </Label>
              </div>
            </RadioGroup>
          )}

          {/* Short Answer */}
          {currentQ.question_type === "short_answer" && (
            <Textarea
              value={answers[currentQ.id] || ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))}
              placeholder="Enter your answer..."
              rows={4}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {currentQuestion === test.questions.length - 1 ? (
            <Button onClick={submitTest} disabled={submitting} className="bg-green-600 hover:bg-green-700">
              {submitting ? (
                <>
                  <AlertCircle className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Test
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestion((prev) => Math.min(test.questions.length - 1, prev + 1))}
              disabled={currentQuestion === test.questions.length - 1}
            >
              Next
            </Button>
          )}
        </div>
      </div>

      {/* Question Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Question Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2">
            {test.questions.map((_, index) => (
              <Button
                key={index}
                variant={
                  currentQuestion === index ? "default" : answers[test.questions[index].id] ? "secondary" : "outline"
                }
                size="sm"
                onClick={() => setCurrentQuestion(index)}
                className="aspect-square p-0"
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

