import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json()

    if (!token || !email) {
      return NextResponse.json({ message: "Token and email are required" }, { status: 400 })
    }

    // Use service role to bypass RLS for invite lookup
    const supabase = await createClient(true)

    // Find the invite by token
    const { data: invite, error: inviteError } = await supabase
      .from("employee_invites")
      .select("*")
      .eq("invite_token", token)
      .eq("status", "pending")
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ message: "Invalid or expired invitation" }, { status: 404 })
    }

    // Check if invite is expired
    if (new Date(invite.expires_at) < new Date()) {
      await supabase
        .from("employee_invites")
        .update({ status: "expired" })
        .eq("id", invite.id)
      return NextResponse.json({ message: "Invitation has expired" }, { status: 410 })
    }

    // Find the newly created profile by email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("email", email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ message: "User profile not found" }, { status: 404 })
    }

    // Link employee to the organization from the invite
    const { error: updateProfileError } = await supabase
      .from("profiles")
      .update({ organization_id: invite.organization_id })
      .eq("id", profile.id)

    if (updateProfileError) {
      return NextResponse.json({ message: "Failed to link to organization" }, { status: 500 })
    }

    // If invite has a program, enroll the employee
    if (invite.program_id) {
      // Check not already enrolled
      const { data: existing } = await supabase
        .from("employee_progress")
        .select("id")
        .eq("employee_id", profile.id)
        .eq("program_id", invite.program_id)
        .single()

      if (!existing) {
        await supabase.from("employee_progress").insert({
          employee_id: profile.id,
          program_id: invite.program_id,
          status: "enrolled",
          progress_percentage: 0,
          enrollment_date: new Date().toISOString().split("T")[0],
        })
      }
    }

    // Mark invite as accepted
    await supabase
      .from("employee_invites")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invite.id)

    return NextResponse.json({ message: "Invitation accepted successfully" })
  } catch (error) {
    console.error("Error accepting invite:", error)
    return NextResponse.json({ message: "Failed to accept invitation" }, { status: 500 })
  }
}
