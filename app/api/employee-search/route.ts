import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateAuth, validateRole, addSecurityHeaders, getClientIP, logSecurityEvent } from "@/lib/security"
import { rateLimit, rateLimitConfigs, getRateLimitHeaders } from "@/lib/rate-limit"
import { handleAPIError, createErrorResponse, ErrorCodes } from "@/lib/error-handler"
import { z } from "zod"

// Validation schema for search query
const searchParamsSchema = z.object({
  q: z.string().min(2).max(50),
  exclude: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)

    // Apply rate limiting
    const rateLimitResult = rateLimit(`search:${clientIP}`, rateLimitConfigs.default)
    if (!rateLimitResult.success) {
      logSecurityEvent("RATE_LIMIT_EXCEEDED", { endpoint: "/api/employee-search", ip: clientIP }, request)
      const response = createErrorResponse(ErrorCodes.RATE_LIMITED)
      const headers = getRateLimitHeaders(rateLimitResult, rateLimitConfigs.default)
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      return addSecurityHeaders(response)
    }

    // Validate authentication and authorization
    const authResult = await validateAuth(request)
    if (!authResult) {
      logSecurityEvent("UNAUTHORIZED_ACCESS", { endpoint: "/api/employee-search", ip: clientIP }, request)
      return addSecurityHeaders(createErrorResponse(ErrorCodes.UNAUTHORIZED))
    }

    const { user, profile } = authResult

    // Only organization admins can search employees
    if (!validateRole(profile, "organization_admin")) {
      logSecurityEvent(
        "FORBIDDEN_ACCESS",
        {
          endpoint: "/api/employee-search",
          userId: user.id,
          role: profile.role,
          ip: clientIP,
        },
        request,
      )
      return addSecurityHeaders(createErrorResponse(ErrorCodes.FORBIDDEN))
    }

    // Get and validate search parameters
    const searchParams = new URL(request.url).searchParams
    const { q, exclude } = searchParamsSchema.parse({
      q: searchParams.get("q"),
      exclude: searchParams.get("exclude") || undefined,
    })

    const excludeIds = exclude ? exclude.split(",") : []

    const supabase = await createClient()

    // Search for employees in the same organization
    const query = supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, role")
      .eq("organization_id", profile.organization_id)
      .eq("role", "employee")
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .order("full_name", { ascending: true })
      .limit(10)

    // Add exclusion filter if provided
    if (excludeIds.length > 0) {
      query.not("id", "in", `(${excludeIds.join(",")})`)
    }

    const { data: employees, error } = await query

    if (error) {
      throw error
    }

    return addSecurityHeaders(NextResponse.json({ employees: employees || [] }))
  } catch (error) {
    logSecurityEvent(
      "API_ERROR",
      {
        endpoint: "/api/employee-search",
        error: error instanceof Error ? error.message : "Unknown error",
        ip: getClientIP(request),
      },
      request,
    )
    return addSecurityHeaders(handleAPIError(error))
  }
}