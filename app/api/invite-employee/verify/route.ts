import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { handleAPIError, createErrorResponse, ErrorCodes } from "@/lib/error-handler"

export async function GET(request: NextRequest) {
  try {
    // Add CORS headers
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { headers });
    }

    const token = request.nextUrl.searchParams.get('token')
    console.log('Verifying token:', token)
    
    if (!token) {
      return createErrorResponse(ErrorCodes.BAD_REQUEST, { message: "Invitation token is required" })
    }

    const supabase = await createClient(false) // Use anon client for verification
    console.log('Supabase client created')

    // First get the invite details without the organization to avoid type issues
    console.log('Fetching invite details for token:', token)
    const { data: invite, error: inviteError } = await supabase
      .from("employee_invites")
      .select("id, email, full_name, organization_id, program_id, expires_at, status")
      .eq("invite_token", token)
      .eq("status", "pending")
      .single();

    console.log('Invite query result:', { invite, error: inviteError })

    if (inviteError || !invite) {
      console.error('Invite verification failed:', inviteError)
      return createErrorResponse(ErrorCodes.NOT_FOUND, { 
        message: "Invalid or expired invitation",
        details: inviteError?.message || "Invite not found"
      })
    }

    // Check if invite has expired
    if (new Date(invite.expires_at) < new Date()) {
      await supabase
        .from("employee_invites")
        .update({ status: "expired" })
        .eq("id", invite.id)

      return createErrorResponse(ErrorCodes.BAD_REQUEST, { message: "Invitation has expired" })
    }

    // Get organization details separately
    console.log('Fetching organization details for id:', invite.organization_id)
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", invite.organization_id)
      .single();

    console.log('Organization query result:', { organization, error: orgError })

    if (orgError || !organization) {
      console.error('Organization lookup failed:', orgError)
      return createErrorResponse(ErrorCodes.NOT_FOUND, { 
        message: "Organization not found",
        details: orgError?.message || "Organization lookup failed"
      })
    }

    const response = NextResponse.json({
      email: invite.email,
      fullName: invite.full_name,
      organizationId: invite.organization_id,
      organizationName: organization.name,
      programId: invite.program_id,
      inviteToken: token
    })

    // Add headers to the response
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response
  } catch (error) {
    console.error("Error verifying invite:", error)
    return handleAPIError(error)
  }
}