interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

export const rateLimitConfigs = {
  inviteEmployee: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 invites per minute
  default: { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 requests per 15 minutes
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 auth attempts per 15 minutes
  ai: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 AI requests per minute
  certificate: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 certificate generations per minute
  enrollEmployee: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 enrollments per minute
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig,
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = identifier

  // Clean up expired entries
  if (store[key] && now > store[key].resetTime) {
    delete store[key]
  }

  // Initialize or get current state
  if (!store[key]) {
    store[key] = {
      count: 0,
      resetTime: now + config.windowMs,
    }
  }

  const current = store[key]

  // Check if limit exceeded
  if (current.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: current.resetTime,
    }
  }

  // Increment counter
  current.count++

  return {
    success: true,
    remaining: config.maxRequests - current.count,
    resetTime: current.resetTime,
  }
}

export function getRateLimitHeaders(result: ReturnType<typeof rateLimit>, config: RateLimitConfig) {
  return {
    "X-RateLimit-Limit": config.maxRequests.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
  }
}
