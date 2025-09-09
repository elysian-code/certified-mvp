import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.error("[API:create-organization] SUPABASE_SERVICE_ROLE_KEY is missing!");
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is missing in server environment." }, { status: 500 });
  }
  try {
    const { name } = await request.json();
    if (!name) {
      return new NextResponse(JSON.stringify({ error: "Organization name is required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    const supabase = await createClient(true);
    const { data, error } = await supabase
      .from("organizations")
      .insert({ name })
      .select("id")
      .single();
    if (error) {
      console.error("[API:create-organization] DB error:", error);
      return new NextResponse(JSON.stringify({ error: error.message, details: error }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
    return new NextResponse(JSON.stringify({ id: data.id }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("[API:create-organization] Unexpected error:", err);
    return new NextResponse(JSON.stringify({ error: "Internal server error", details: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
