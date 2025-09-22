import { createClient } from "@/lib/supabase/client"

export async function signUp({ email, password, fullName, role, organizationName }: {
  email: string
  password: string
  fullName: string
  role: string
  organizationName?: string
}) {
  const supabase = createClient()
  let orgId: string | undefined
  if (role === "organization_admin" && organizationName) {
    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .insert([{ name: organizationName }])
      .select()
      .single()
    if (orgError || !orgData?.id) {
      throw new Error(orgError?.message || "Failed to create organization")
    }
    orgId = orgData.id
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
        organization_id: orgId || null,
      },
    },
  })
  if (error) throw error
  if (data?.user?.id) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      role,
      organization_id: orgId || null,
    })
  }
  return data
}

export async function login({ email, password }: { email: string; password: string }) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function logout() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function resetPassword(email: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/login`,
  })
  if (error) throw error
}

export async function _getUser() {
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    if (data) return data?.user || null
}