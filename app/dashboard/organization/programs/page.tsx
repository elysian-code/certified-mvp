import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Users, Calendar } from "lucide-react"
import Link from "next/link"

export default async function ProgramsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organization:organizations(*)")
    .eq("id", data.user.id)
    .single()

  if (!profile || profile.role !== "organization_admin") {
    redirect("/dashboard")
  }

  // Get programs with enrollment counts
  const { data: programs } = await supabase
    .from("certification_programs")
    .select(`
      *,
      employee_progress(count)
    `)
    .eq("organization_id", profile.organization.id)
    .order("created_at", { ascending: false })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Certification Programs</h1>
          <p className="text-gray-600">Manage your organization's certification programs</p>
        </div>
        <Link href="/dashboard/organization/programs/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Program
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs?.map((program) => (
          <Card key={program.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{program.name}</CardTitle>
                  <CardDescription className="mt-2">{program.description}</CardDescription>
                </div>
                <Badge variant={program.is_active ? "default" : "secondary"}>
                  {program.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {program.duration_months} months duration
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  {program.employee_progress?.[0]?.count || 0} enrolled
                </div>
                {program.requirements && (
                  <div className="text-sm text-gray-600">
                    <strong>Requirements:</strong> {program.requirements}
                  </div>
                )}
                <div className="flex space-x-2 pt-4">
                  <Link href={`/dashboard/organization/programs/${program.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!programs || programs.length === 0) && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No programs yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first certification program.</p>
            <Link href="/dashboard/organization/programs/new">
              <Button>Create Your First Program</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
