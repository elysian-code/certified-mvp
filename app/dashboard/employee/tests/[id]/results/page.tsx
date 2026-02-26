import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Award, ArrowLeft, Trophy } from "lucide-react"
import Link from "next/link"

interface PageProps {
  params: Promise<{ id: string }>
}

function getGrade(score: number): { grade: string; label: string; color: string } {
  if (score >= 90) return { grade: "excellent", label: "Excellent", color: "bg-green-600" }
  if (score >= 80) return { grade: "good", label: "Good", color: "bg-blue-600" }
  if (score >= 70) return { grade: "pass", label: "Pass", color: "bg-teal-600" }
  if (score >= 50) return { grade: "fair", label: "Fair", color: "bg-yellow-500" }
  return { grade: "fail", label: "Fail", color: "bg-red-600" }
}

export default async function TestResultsPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData?.user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", authData.user.id)
    .single()

  if (!profile || profile.role !== "employee") {
    redirect("/dashboard")
  }

  // Get test details
  const { data: test } = await supabase
    .from("cbt_tests")
    .select(`
      id,
      name,
      description,
      passing_score,
      time_limit_minutes,
      program_id
    `)
    .eq("id", id)
    .single()

  if (!test) {
    redirect("/dashboard/employee")
  }

  // Get test attempt for this employee
  const { data: attempt } = await supabase
    .from("test_attempts")
    .select("*")
    .eq("employee_id", profile.id)
    .eq("test_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (!attempt) {
    redirect(`/dashboard/employee/tests/${id}/take`)
  }

  // Get questions with correct answers for review
  const { data: questions } = await supabase
    .from("cbt_questions")
    .select("id, question_text, question_type, options, correct_answer")
    .eq("test_id", id)

  const score = attempt.score ?? 0
  const passed = attempt.passed ?? false
  const { label: gradeLabel, color: gradeColor } = getGrade(score)

  const answers: Record<string, string> = attempt.answers
    ? typeof attempt.answers === "string"
      ? JSON.parse(attempt.answers)
      : attempt.answers
    : {}

  const totalQuestions = questions?.length ?? 0
  const correctCount = questions?.filter((q) => answers[q.id] === q.correct_answer).length ?? 0

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div>
        <Link
          href={`/dashboard/employee/programs/${test.program_id}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Program
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{test.name} — Results</h1>
        <p className="text-gray-600">{test.description}</p>
      </div>

      {/* Score Summary */}
      <Card className={`border-2 ${passed ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              {passed ? (
                <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                  <Trophy className="h-12 w-12 text-green-600" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-red-600" />
                </div>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="text-5xl font-bold text-gray-900 mb-2">{score}%</div>
              <Badge className={`${gradeColor} text-white text-sm px-3 py-1`}>{gradeLabel}</Badge>
              <p className="mt-2 text-gray-600">
                {correctCount} of {totalQuestions} questions correct
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Passing score: {test.passing_score}%{" "}
                {passed ? (
                  <span className="text-green-600 font-medium">— Congratulations, you passed!</span>
                ) : (
                  <span className="text-red-600 font-medium">— You did not pass this time.</span>
                )}
              </p>
            </div>
            {passed && (
              <div className="flex-shrink-0">
                <Link href="/dashboard/employee/certificates">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Award className="h-4 w-4 mr-2" />
                    View Certificate
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Question Review */}
      {questions && questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Question Review</CardTitle>
            <CardDescription>Review your answers vs the correct answers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((question, index) => {
              const userAnswer = answers[question.id]
              const isCorrect = userAnswer === question.correct_answer
              return (
                <div
                  key={question.id}
                  className={`border rounded-lg p-4 ${isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 mb-2">
                        Q{index + 1}. {question.question_text}
                      </p>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium text-gray-600">Your answer: </span>
                          <span className={isCorrect ? "text-green-700" : "text-red-700"}>
                            {userAnswer || <em className="text-gray-400">Not answered</em>}
                          </span>
                        </p>
                        {!isCorrect && (
                          <p>
                            <span className="font-medium text-gray-600">Correct answer: </span>
                            <span className="text-green-700">{question.correct_answer}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
