import { z } from "zod"

// Common validation schemas
export const uuidSchema = z.string().uuid("Invalid UUID format")
export const emailSchema = z.string().email("Invalid email format")
export const roleSchema = z.enum(["organization_admin", "employee"])

// API request validation schemas
export const generateQuestionsSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters").max(200, "Topic too long"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  questionCount: z.number().int().min(5).max(50),
  questionType: z.enum(["multiple_choice", "true_false", "short_answer"]),
})

export const generateCertificateSchema = z.object({
  employeeId: uuidSchema,
  programId: uuidSchema,
})

export const testAttemptSchema = z.object({
  testId: uuidSchema,
  answers: z.record(z.string()),
})

export const reportSubmissionSchema = z.object({
  programId: uuidSchema,
  reportType: z.enum(["progress", "completion", "assessment"]),
  content: z.string().min(10, "Report content too short").max(5000, "Report content too long"),
})

export const verificationCodeSchema = z.object({
  verificationCode: z.string().regex(/^[A-Z0-9]{12}$/, "Invalid verification code format"),
})

export const inviteEmployeeSchema = z.object({
  email: emailSchema,
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  programId: uuidSchema,
})

// Sanitization helpers
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, "")
}

export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}
