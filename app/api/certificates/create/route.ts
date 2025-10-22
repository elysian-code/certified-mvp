import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { randomUUID } from "crypto"

export async function POST(req: Request) {
  try {
    const { employee_id, program_id, score, passed } = await req.json()
    if (!passed) {
      return NextResponse.json({ error: "Employee did not pass" }, { status: 400 })
    }

    // Use service role for secure inserts
    const supabase = await createClient(true)

    // Fetch program details (to get certificate template + org)
    const { data: program, error: programError } = await supabase
      .from("programs")
      .select("id, name, certificate_template_id, start_date, end_date, organization_id")
      .eq("id", program_id)
      .single()

    if (programError || !program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 })
    }

    const certificateId = "CERT-" + randomUUID()

    const { error: insertError } = await supabase.from("certificates").insert([
      {
        employee_id,
        program_id,
        organization_id: program.organization_id,
        template_id: program.certificate_template_id,
        certificate_id: certificateId,
        issued_at: new Date().toISOString(),
        score,
      },
    ])

    if (insertError) {
      console.error(insertError)
      return NextResponse.json({ error: "Failed to create certificate" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Certificate created",
      certificate_id: certificateId,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
