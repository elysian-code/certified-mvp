import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateRole, addSecurityHeaders, getClientIP, logSecurityEvent } from "@/lib/security"
import { validateAuth } from "@/lib/auth-validation"
import { rateLimit, rateLimitConfigs, getRateLimitHeaders, RateLimitResult } from "@/lib/rate-limit"
import { handleAPIError, createErrorResponse, ErrorCodes, validateRequestSize } from "@/lib/error-handler"
import { z } from "zod"
import { inviteEmployeeSchema } from "@/lib/validation"
import { sendInviteEmail } from "@/lib/send-invite-email"

// Enhanced invite schema with program information
const inviteWithProgramSchema = inviteEmployeeSchema.extend({
  programId: z.string().uuid()
})

export async function POST(request: NextRequest) {
  try {
    // Check request size
    await validateRequestSize(request)

    // Rate limiting
    const clientIP = getClientIP(request)
    const limiter = await rateLimit(clientIP, rateLimitConfigs.inviteEmployee)
    if (!limiter.success) {
      const response = createErrorResponse(ErrorCodes.RATE_LIMITED, { 
        message: "Too many invite attempts. Please try again later.",
        retryAfter: Math.ceil((limiter.resetTime - Date.now()) / 1000)
      })
      return addSecurityHeaders(response)
    }

    // Validate auth and admin role
    const authResult = await validateAuth(request)
    if (!authResult.success) {
      return addSecurityHeaders(createErrorResponse(ErrorCodes.UNAUTHORIZED))
    }

    const { user, profile } = authResult

    if (!validateRole(profile, "organization_admin")) {
      logSecurityEvent(
        "FORBIDDEN_ACCESS",
        {
          endpoint: "/api/invite-employee",
          userId: user.id,
          role: profile.role,
          ip: clientIP,
        },
        request
      )
      return addSecurityHeaders(createErrorResponse(ErrorCodes.FORBIDDEN))
    }

    // Validate request body
    let email: string;
    let fullName: string;
    let programId: string;

    try {
      const body = await request.json()
      console.log('Request body:', body);
      
      const validatedData = inviteWithProgramSchema.parse(body)
      console.log('Validated data:', validatedData);
      
      email = validatedData.email;
      fullName = validatedData.fullName;
      programId = validatedData.programId;
    } catch (error) {
      console.error('Validation or parsing error:', error);
      return addSecurityHeaders(
        createErrorResponse(ErrorCodes.BAD_REQUEST, { 
          message: "Invalid request data", 
          details: error instanceof Error ? error.message : "Validation failed" 
        })
      )
    }

    const supabase = await createClient(true) // Using service role for admin operations

    // Get organization details
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", profile.organization_id)
      .single()

    if (!org) {
      return addSecurityHeaders(
        createErrorResponse(ErrorCodes.NOT_FOUND, { message: "Organization not found" })
      )
    }

    // Get program details
    const { data: program } = await supabase
      .from("certification_programs")
      .select("name")
      .eq("id", programId)
      .eq("organization_id", profile.organization_id)
      .single()

    if (!program) {
      return addSecurityHeaders(
        createErrorResponse(ErrorCodes.NOT_FOUND, { message: "Program not found" })
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id, role, organization_id")
      .eq("email", email)
      .single()

    if (existingUser) {
      if (existingUser.organization_id === profile.organization_id) {
        return addSecurityHeaders(
          createErrorResponse(ErrorCodes.CONFLICT, { message: "User is already a member of your organization" })
        )
      } else {
        return addSecurityHeaders(
          createErrorResponse(ErrorCodes.CONFLICT, { message: "User already belongs to another organization" })
        )
      }
    }

    // Generate invite token
    const inviteToken = crypto.randomUUID()
    const inviteExpiry = new Date()
    inviteExpiry.setDate(inviteExpiry.getDate() + 7) // Invite valid for 7 days

    // Create invite record
    const { error: inviteError } = await supabase.from("employee_invites").insert({
      email,
      full_name: fullName,
      organization_id: profile.organization_id,
      program_id: programId,
      invite_token: inviteToken,
      expires_at: inviteExpiry.toISOString(),
      invited_by: user.id,
      status: "pending"
    })

    if (inviteError) {
      throw inviteError
    }

    // Send invite email with program information
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/sign-up?token=${inviteToken}`
    await sendInviteEmail({
      email,
      fullName,
      organizationName: org.name,
      programName: program.name,
      inviteUrl,
      expiresAt: inviteExpiry.toISOString()
    })

    const response = NextResponse.json(
      { message: "Invite sent successfully" },
      { status: 200 }
    )

    // Add rate limit and security headers
    const headers = response.headers
    headers.set("X-RateLimit-Limit", String(rateLimitConfigs.inviteEmployee.maxRequests))
    headers.set("X-RateLimit-Remaining", String(limiter.remaining))
    headers.set("X-RateLimit-Reset", String(limiter.resetTime))

    return addSecurityHeaders(response)
  } catch (error) {
    console.error('Error in invite-employee route:', error);
    const response = handleAPIError(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return addSecurityHeaders(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to process invite request',
        details: errorMessage
      })
    );
  }
}