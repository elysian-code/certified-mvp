import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateRole, addSecurityHeaders } from "@/lib/security"
import { validateAuth } from "@/lib/auth-validation"
import { handleAPIError, createErrorResponse, ErrorCodes } from "@/lib/error-handler"

export async function POST(request: NextRequest) {
  try {
    // Validate auth and admin role
    const authResult = await validateAuth(request)
    if (!authResult.success) {
      return addSecurityHeaders(createErrorResponse(ErrorCodes.UNAUTHORIZED))
    }

    const { user, profile } = authResult

    if (!validateRole(profile, "organization_admin")) {
      return addSecurityHeaders(createErrorResponse(ErrorCodes.FORBIDDEN))
    }

    // Parse form data
    const formData = await request.formData()
    const name = formData.get("name")?.toString()
    const website = formData.get("website")?.toString()
    const description = formData.get("description")?.toString()

    if (!name) {
      return addSecurityHeaders(
        createErrorResponse(ErrorCodes.BAD_REQUEST, { message: "Organization name is required" })
      )
    }

    // Update organization
    const supabase = await createClient(true)
    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        name,
        website,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.organization_id)

    if (updateError) {
      throw updateError
    }

    return new Response(JSON.stringify({ message: "Organization updated successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return handleAPIError(error)
  }
}