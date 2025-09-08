import { type NextRequest, NextResponse } from "next/server"
import { groq } from "@ai-sdk/groq"
import { generateObject } from "ai"
import { z } from "zod"
import { validateAuth, validateRole, addSecurityHeaders, getClientIP, logSecurityEvent } from "@/lib/security"
import { rateLimit, rateLimitConfigs, getRateLimitHeaders } from "@/lib/rate-limit"
import { generateQuestionsSchema, sanitizeString } from "@/lib/validation"
import { handleAPIError, createErrorResponse, ErrorCodes, validateRequestSize } from "@/lib/error-handler"

const questionSchema = z.object({
  questions: z.array(
    z.object({
      question_text: z.string(),
      question_type: z.enum(["multiple_choice", "true_false", "short_answer"]),
      options: z.array(z.string()).optional(),
      correct_answer: z.string(),
      explanation: z.string(),
    }),
  ),
})

export async function POST(request: NextRequest) {
  try {
    if (!validateRequestSize(request, 10 * 1024)) {
      // 10KB limit
      return createErrorResponse(ErrorCodes.BAD_REQUEST, { message: "Request too large" })
    }

    const clientIP = getClientIP(request)

    const rateLimitResult = rateLimit(`ai:${clientIP}`, rateLimitConfigs.ai)
    if (!rateLimitResult.success) {
      logSecurityEvent("RATE_LIMIT_EXCEEDED", { endpoint: "/api/generate-questions", ip: clientIP }, request)
      const response = createErrorResponse(ErrorCodes.RATE_LIMITED)
      const headers = getRateLimitHeaders(rateLimitResult, rateLimitConfigs.ai)
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      return addSecurityHeaders(response)
    }

    const authResult = await validateAuth(request)
    if (!authResult) {
      logSecurityEvent("UNAUTHORIZED_ACCESS", { endpoint: "/api/generate-questions", ip: clientIP }, request)
      return addSecurityHeaders(createErrorResponse(ErrorCodes.UNAUTHORIZED))
    }

    const { user, profile } = authResult

    if (!validateRole(profile, "organization_admin")) {
      logSecurityEvent(
        "FORBIDDEN_ACCESS",
        {
          endpoint: "/api/generate-questions",
          userId: user.id,
          role: profile.role,
          ip: clientIP,
        },
        request,
      )
      return addSecurityHeaders(createErrorResponse(ErrorCodes.FORBIDDEN))
    }

    const body = await request.json()
    const validatedData = generateQuestionsSchema.parse(body)

    // Sanitize string inputs
    const sanitizedTopic = sanitizeString(validatedData.topic)

    const { object } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      schema: questionSchema,
      prompt: `Generate ${validatedData.questionCount} ${validatedData.difficulty} level ${validatedData.questionType} questions about ${sanitizedTopic}. 
      
      For multiple choice questions, provide 4 options with only one correct answer.
      For true/false questions, provide a clear statement that can be definitively true or false.
      For short answer questions, provide questions that have specific, measurable answers.
      
      Each question should include:
      - Clear, professional question text
      - Appropriate options (for multiple choice)
      - The correct answer
      - A brief explanation of why the answer is correct
      
      Focus on practical, real-world scenarios and industry best practices.`,
    })

    logSecurityEvent(
      "AI_QUESTIONS_GENERATED",
      {
        userId: user.id,
        organizationId: profile.organization_id,
        topic: sanitizedTopic,
        questionCount: validatedData.questionCount,
        ip: clientIP,
      },
      request,
    )

    const response = NextResponse.json({ questions: object.questions })
    const headers = getRateLimitHeaders(rateLimitResult, rateLimitConfigs.ai)
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return addSecurityHeaders(response)
  } catch (error) {
    logSecurityEvent(
      "API_ERROR",
      {
        endpoint: "/api/generate-questions",
        error: error instanceof Error ? error.message : "Unknown error",
        ip: getClientIP(request),
      },
      request,
    )
    return addSecurityHeaders(handleAPIError(error))
  }
}
