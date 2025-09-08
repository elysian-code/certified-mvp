import { updateSession } from "@/lib/supabase/middleware"
import { addSecurityHeaders, getClientIP, logSecurityEvent } from "@/lib/security"
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit"
import type { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const clientIP = getClientIP(request)
  const rateLimitResult = rateLimit(`global:${clientIP}`, rateLimitConfigs.default)

  if (!rateLimitResult.success) {
    logSecurityEvent(
      "GLOBAL_RATE_LIMIT_EXCEEDED",
      {
        path: request.nextUrl.pathname,
        ip: clientIP,
      },
      request,
    )

    const response = new Response("Too Many Requests", { status: 429 })
    response.headers.set("Retry-After", Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString())
    return addSecurityHeaders(response as NextResponse)
  }

  const response = await updateSession(request)

  const secureResponse = addSecurityHeaders(response)

  if (request.nextUrl.pathname.includes("admin") || request.nextUrl.pathname.includes("api")) {
    logSecurityEvent(
      "SENSITIVE_PATH_ACCESS",
      {
        path: request.nextUrl.pathname,
        ip: clientIP,
        userAgent: request.headers.get("user-agent") || "unknown",
      },
      request,
    )
  }

  return secureResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
