import { type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export interface AuthValidationResult {
  success: boolean
  user?: any
  profile?: any
  error?: string
}

export async function validateAuth(request: NextRequest): Promise<AuthValidationResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Unauthorized" }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return { success: false, error: "Profile not found" }
    }

    return { success: true, user, profile }
  } catch (error) {
    return { success: false, error: "Authentication failed" }
  }
}