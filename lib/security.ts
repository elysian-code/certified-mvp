import type { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export interface SecurityHeaders {
  "X-Content-Type-Options": string
  "X-Frame-Options": string
  "X-XSS-Protection": string
  "Referrer-Policy": string
  "Permissions-Policy": string
  "Strict-Transport-Security": string
}

export const securityHeaders: SecurityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
}

export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

export async function validateAuth(request: NextRequest): Promise<{ user: any; profile: any } | null> {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return null
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return null
    }

    return { user, profile }
  } catch (error) {
    console.error("[SECURITY] Auth validation error:", error)
    return null
  }
}

export function validateRole(profile: any, requiredRole: string): boolean {
  return profile?.role === requiredRole
}

export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  if (realIP) {
    return realIP
  }

  return "unknown"
}

export function logSecurityEvent(event: string, details: any, request: NextRequest) {
  const timestamp = new Date().toISOString()
  const ip = getClientIP(request)
  const userAgent = request.headers.get("user-agent") || "unknown"

  console.log(`[SECURITY] ${timestamp} - ${event}`, {
    ip,
    userAgent,
    ...details,
  })
}
