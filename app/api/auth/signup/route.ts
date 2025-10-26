import { createServiceClient } from "@/lib/supabase/service-client"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

const headers = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store'
};

export async function POST(request: Request) {
  // Ensure we're only handling POST requests
  if (request.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405, headers }
    );
  }

  // Wrap everything in a try-catch to ensure JSON responses
  try {
    const params = await request.json()
    const {
      email,
      password,
      fullName,
      organizationName,
      organizationId,
      inviteToken,
      programId
    } = params
    
    // Handle role assignment
    let role = inviteToken ? 'employee' : params.role

    console.log('Processing signup request:', {
      ...params,
      password: '[REDACTED]'
    });

    const adminClient = createServiceClient()
    let orgId: string | undefined = organizationId

    // Handle invite-based signup
    if (inviteToken) {
      console.log('Processing invite-based signup');
      if (!programId) {
        return NextResponse.json(
          { error: "Program ID is required for invite-based signup" },
          { status: 400 }
        );
      }
      
      // Verify invitation before creating user
      const { data: invite, error: verifyError } = await adminClient
        .from("employee_invites")
        .select("id, status, expires_at, organization_id")
        .eq("invite_token", inviteToken)
        .eq("status", "pending")
        .single();

      if (verifyError || !invite) {
        console.error('Invite verification failed:', verifyError);
        return NextResponse.json(
          { error: "Invalid or expired invitation" },
          { status: 400 }
        );
      }

      if (new Date(invite.expires_at) < new Date()) {
        await adminClient
          .from("employee_invites")
          .update({ status: "expired" })
          .eq("id", invite.id);

        return NextResponse.json(
          { error: "Invitation has expired" },
          { status: 400 }
        );
      }

      orgId = invite.organization_id;
      role = 'employee'; // Force role to employee for invite-based signups
    }
    // Handle regular signup
    else if (role === "organization_admin" && organizationName) {
      const { data: orgData, error: orgError } = await adminClient
        .from("organizations")
        .insert([{ name: organizationName }])
        .select()
        .single()

      if (orgError || !orgData?.id) {
        return NextResponse.json(
          { error: orgError?.message || "Failed to create organization" },
          { status: 400 }
        )
      }
      orgId = orgData.id
    }

    // Create user account
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
        organization_id: orgId || null,
      }
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (data?.user?.id) {
      // Create user profile
      await adminClient.from("profiles").upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        role,
        organization_id: orgId || null,
      })

      // Handle invite acceptance if this is an invited user
      if (inviteToken && programId) {
        try {
          // Verify and process invitation using RPC for atomic operation
          const { data: invite, error: verifyError } = await adminClient.rpc(
            'verify_and_accept_invite',
            { 
              p_invite_token: inviteToken,
              p_user_id: data.user.id,
              p_program_id: programId
            }
          );

          if (verifyError) {
            console.error('Invite verification error:', verifyError);
            return NextResponse.json(
              { error: verifyError.message || "Failed to verify invitation" },
              { status: 400 }
            )
          }

          if (!invite) {
            return NextResponse.json(
              { error: "Invalid or expired invitation" },
              { status: 400 }
            )
          }

          // Update user metadata with organization ID
          const { error: updateError } = await adminClient.auth.admin.updateUserById(
            data.user.id,
            {
              user_metadata: {
                ...data.user.user_metadata,
                organization_id: invite.organization_id
              }
            }
          )

          if (updateError) {
            console.error('User metadata update error:', updateError);
            throw new Error("Failed to update user organization")
          }

          // Update user profile with organization ID
          const { error: profileError } = await adminClient
            .from("profiles")
            .update({ 
              organization_id: invite.organization_id,
              role: 'employee'  // Ensure role is set for invited employees
            })
            .eq("id", data.user.id)

          if (profileError) {
            console.error('Profile update error:', profileError);
            throw new Error("Failed to update user profile")
          }
        } catch (error) {
          return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to process invitation" },
            { status: 400 }
          )
        }
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
    const responseHeaders = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
    return NextResponse.json({ user: data.user }, { headers: responseHeaders })
  } catch (error) {
    console.error('Error in signup route:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create account" },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    )
  }
}