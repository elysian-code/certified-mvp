import { NextResponse } from "next/server"
import { ZodError } from "zod"

export interface APIError {
  code: string
  message: string
  statusCode: number
}

export const ErrorCodes = {
  UNAUTHORIZED: { code: "UNAUTHORIZED", message: "Authentication required", statusCode: 401 },
  FORBIDDEN: { code: "FORBIDDEN", message: "Insufficient permissions", statusCode: 403 },
  NOT_FOUND: { code: "NOT_FOUND", message: "Resource not found", statusCode: 404 },
  VALIDATION_ERROR: { code: "VALIDATION_ERROR", message: "Invalid input data", statusCode: 400 },
  RATE_LIMITED: { code: "RATE_LIMITED", message: "Too many requests", statusCode: 429 },
  CONFLICT: { code: "CONFLICT", message: "Resource conflict", statusCode: 409 },
  TOO_MANY_REQUESTS: { code: "TOO_MANY_REQUESTS", message: "Too many requests", statusCode: 429 },
  INTERNAL_ERROR: { code: "INTERNAL_ERROR", message: "Internal server error", statusCode: 500 },
  BAD_REQUEST: { code: "BAD_REQUEST", message: "Bad request", statusCode: 400 },
} as const

export function createErrorResponse(error: APIError, details?: any): NextResponse {
  const response = {
    error: {
      code: error.code,
      message: error.message,
    },
    ...(process.env.NODE_ENV === "development" && details && { details }),
  }

  return NextResponse.json(response, { status: error.statusCode })
}

export function handleAPIError(error: unknown): NextResponse {
  console.error("[API_ERROR]", error)

  if (error instanceof ZodError) {
    return createErrorResponse(ErrorCodes.VALIDATION_ERROR, {
      validationErrors: error.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    })
  }

  if (error instanceof Error) {
    // Don't expose internal error messages in production
    if (process.env.NODE_ENV === "production") {
      return createErrorResponse(ErrorCodes.INTERNAL_ERROR)
    }

    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, {
      message: error.message,
      stack: error.stack,
    })
  }

  return createErrorResponse(ErrorCodes.INTERNAL_ERROR)
}

export function validateRequestSize(request: Request, maxSizeBytes: number = 1024 * 1024): boolean {
  const contentLength = request.headers.get("content-length")
  if (contentLength && Number.parseInt(contentLength) > maxSizeBytes) {
    return false
  }
  return true
}
