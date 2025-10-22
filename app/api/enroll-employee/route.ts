import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateAuth, validateRole, addSecurityHeaders, getClientIP, logSecurityEvent } from "@/lib/security"
import { rateLimit, rateLimitConfigs, getRateLimitHeaders } from "@/lib/rate-limit"
import { handleAPIError, createErrorResponse, ErrorCodes, validateRequestSize } from "@/lib/error-handler"
import { z } from "zod"

// Validation schema for enrollment request
const enrollEmployeeSchema = z.object({
  employeeId: z.string().uuid(),
  programId: z.string().uuid(),
})

// Validation schema for invite request
const inviteEmployeeSchema = z.object({
  email: z.string().email(),
  programId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    if (!validateRequestSize(request, 5 * 1024)) {
      return createErrorResponse(ErrorCodes.BAD_REQUEST, { message: "Request too large" })
    }

    const clientIP = getClientIP(request)

    // Apply rate limiting
    const rateLimitResult = rateLimit(`enroll:${clientIP}`, rateLimitConfigs.enrollEmployee)
    if (!rateLimitResult.success) {
      logSecurityEvent("RATE_LIMIT_EXCEEDED", { endpoint: "/api/enroll-employee", ip: clientIP }, request)
      const response = createErrorResponse(ErrorCodes.RATE_LIMITED)
      const headers = getRateLimitHeaders(rateLimitResult, rateLimitConfigs.enrollEmployee)
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      return addSecurityHeaders(response)
    }

    // Validate authentication and authorization
    const authResult = await validateAuth(request)
    if (!authResult) {
      logSecurityEvent("UNAUTHORIZED_ACCESS", { endpoint: "/api/enroll-employee", ip: clientIP }, request)
      return addSecurityHeaders(createErrorResponse(ErrorCodes.UNAUTHORIZED))
    }

    const { user, profile } = authResult

    // Only organization admins can enroll employees
    if (!validateRole(profile, "organization_admin")) {
      logSecurityEvent(
        "FORBIDDEN_ACCESS",
        {
          endpoint: "/api/enroll-employee",
          userId: user.id,
          role: profile.role,
          ip: clientIP,
        },
        request,
      )
      return addSecurityHeaders(createErrorResponse(ErrorCodes.FORBIDDEN))
    }

    const body = await request.json()
    const supabase = await createClient()

    // Check if this is an enrollment or invite request
    const isInvite = "email" in body

    if (isInvite) {
      // Handle invite for unregistered user
      const { email, programId } = inviteEmployeeSchema.parse(body)

      // Verify program belongs to organization
      const { data: program, error: programError } = await supabase
        .from("certification_programs")
        .select("id")
        .eq("id", programId)
        .eq("organization_id", profile.organization_id)
        .single()

      if (programError || !program) {
        return addSecurityHeaders(createErrorResponse(ErrorCodes.NOT_FOUND, { message: "Program not found" }))
      }

      // Check if an invite already exists
      const { data: existingInvite } = await supabase
        .from("employee_invites")
        .select("id, status")
        .eq("email", email)
        .eq("organization_id", profile.organization_id)
        .eq("program_id", programId)
        .single()

      if (existingInvite) {
        if (existingInvite.status === "pending") {
          return addSecurityHeaders(
            createErrorResponse(ErrorCodes.BAD_REQUEST, { message: "Invitation already sent to this email" }),
          )
        }

        // If invite exists but is expired, update it
        await supabase
          .from("employee_invites")
          .update({
            status: "pending",
            invited_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days expiry
          })
          .eq("id", existingInvite.id)

        // Send invitation email (implement in a separate API route)
        await fetch("/api/invite-employee", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inviteId: existingInvite.id }),
        })

        return addSecurityHeaders(NextResponse.json({ message: "Invitation resent successfully" }))
      }

      // Create new invite
      const { data: invite, error: inviteError } = await supabase
        .from("employee_invites")
        .insert({
          email,
          organization_id: profile.organization_id,
          program_id: programId,
          invited_by: user.id,
          status: "pending",
          invited_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days expiry
        })
        .select()
        .single()

      if (inviteError) {
        throw inviteError
      }

      // Send invitation email
      await fetch("/api/invite-employee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inviteId: invite.id }),
      })

      return addSecurityHeaders(NextResponse.json({ message: "Invitation sent successfully" }))
    } else {
      // Handle enrollment of existing user
      const { employeeId, programId } = enrollEmployeeSchema.parse(body)

      // Verify employee exists and belongs to organization
      const { data: employee, error: employeeError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", employeeId)
        .eq("organization_id", profile.organization_id)
        .eq("role", "employee")
        .single()

      if (employeeError || !employee) {
        return addSecurityHeaders(createErrorResponse(ErrorCodes.NOT_FOUND, { message: "Employee not found" }))
      }

      // Verify program belongs to organization
      const { data: program, error: programError } = await supabase
        .from("certification_programs")
        .select("id")
        .eq("id", programId)
        .eq("organization_id", profile.organization_id)
        .single()

      if (programError || !program) {
        return addSecurityHeaders(createErrorResponse(ErrorCodes.NOT_FOUND, { message: "Program not found" }))
      }

      // Check if employee is already enrolled
      const { data: existingEnrollment } = await supabase
        .from("employee_progress")
        .select("id")
        .eq("employee_id", employeeId)
        .eq("program_id", programId)
        .single()

      if (existingEnrollment) {
        return addSecurityHeaders(
          createErrorResponse(ErrorCodes.BAD_REQUEST, { message: "Employee already enrolled in this program" }),
        )
      }

      // Create enrollment
      const { error: enrollError } = await supabase.from("employee_progress").insert({
        employee_id: employeeId,
        program_id: programId,
        status: "in_progress",
        progress_percentage: 0,
        enrolled_at: new Date().toISOString(),
      })

      if (enrollError) {
        throw enrollError
      }

      logSecurityEvent(
        "EMPLOYEE_ENROLLED",
        {
          userId: user.id,
          employeeId,
          programId,
          organizationId: profile.organization_id,
          ip: clientIP,
        },
        request,
      )

      return addSecurityHeaders(NextResponse.json({ message: "Employee enrolled successfully" }))
    }
  } catch (error) {
    logSecurityEvent(
      "API_ERROR",
      {
        endpoint: "/api/enroll-employee",
        error: error instanceof Error ? error.message : "Unknown error",
        ip: getClientIP(request),
      },
      request,
    )
    return addSecurityHeaders(handleAPIError(error))
  }
}