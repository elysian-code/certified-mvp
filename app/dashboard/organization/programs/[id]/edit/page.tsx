import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EditProgramForm } from "./edit-form"

export default async function ProgramEditPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect("/auth/login")
  }

  // Get user profile and verify organization admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organization:organizations(*)")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "organization_admin") {
    redirect("/dashboard/employee")
  }

  // Get program details
  const { data: program, error: programError } = await supabase
    .from("certification_programs")
    .select("*")
    .eq("id", params.id)
    .single()

  if (programError || !program) {
    notFound()
  }

  // Verify program belongs to user's organization
  if (program.organization_id !== profile.organization?.id) {
    redirect("/dashboard/organization/programs")
  }

  return <EditProgramForm program={program} />
}