import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const formData = await request.json()
  const { event, session } = formData

  const supabase = await createClient(true)

  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    const response = NextResponse.json({ ok: true })
    return response
  }

  return NextResponse.json({ ok: true })
}