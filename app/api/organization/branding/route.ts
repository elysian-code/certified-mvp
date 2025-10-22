import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateRole, addSecurityHeaders } from "@/lib/security"
import { validateAuth } from "@/lib/auth-validation"
import { handleAPIError, createErrorResponse, ErrorCodes } from "@/lib/error-handler"

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

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
    const logo = formData.get("logo") as File
    const primaryColor = formData.get("primaryColor")?.toString()

    const supabase = await createClient(true)

    // Handle logo upload if provided
    let logoUrl = null
    if (logo && logo.size > 0) {
      if (logo.size > MAX_FILE_SIZE) {
        return addSecurityHeaders(
          createErrorResponse(ErrorCodes.BAD_REQUEST, { message: "Logo file size exceeds 2MB limit" })
        )
      }

      // Upload logo to storage
      const fileExt = logo.name.split(".").pop()
      const filePath = `organizations/${profile.organization_id}/logo.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("organization-assets")
        .upload(filePath, logo, {
          upsert: true,
          contentType: logo.type,
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from("organization-assets")
        .getPublicUrl(filePath)

      logoUrl = urlData.publicUrl
    }

    // Update organization branding
    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (logoUrl) {
      updates.logo_url = logoUrl
    }

    if (primaryColor) {
      updates.primary_color = primaryColor
    }

    const { error: updateError } = await supabase
      .from("organizations")
      .update(updates)
      .eq("id", profile.organization_id)

    if (updateError) {
      throw updateError
    }

    return new Response(JSON.stringify({ message: "Branding updated successfully", logoUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return handleAPIError(error)
  }
}