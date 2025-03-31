// Enhanced rate limiter with per-user and IP-based limiting
import { auth } from "@clerk/nextjs/server"

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

const defaultConfig: RateLimitConfig = {
  maxRequests: 100, // 100 requests
  windowMs: 60 * 1000 // per minute
}

const userLimits = new Map<string, { count: number; resetTime: number }>()
const ipLimits = new Map<string, { count: number; resetTime: number }>()

function getKey(identifier: string, type: 'user' | 'ip'): string {
  return `${type}:${identifier}`
}

function isRateLimited(identifier: string, type: 'user' | 'ip', config: RateLimitConfig = defaultConfig): boolean {
  const key = getKey(identifier, type)
  const now = Date.now()
  const limit = type === 'user' ? userLimits : ipLimits
  const current = limit.get(key)

  if (!current) {
    limit.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    })
    return false
  }

  if (now > current.resetTime) {
    limit.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    })
    return false
  }

  if (current.count >= config.maxRequests) {
    return true
  }

  current.count++
  return false
}

export async function rateLimitedFetch(url: string, options?: RequestInit): Promise<Response> {
  const { userId } = auth()
  const ip = options?.headers?.['x-forwarded-for'] as string || 'unknown'
  
  // Check both user and IP limits
  if (userId && isRateLimited(userId, 'user')) {
    throw new Error('Rate limit exceeded for user')
  }
  
  if (isRateLimited(ip, 'ip')) {
    throw new Error('Rate limit exceeded for IP')
  }

  try {
    const response = await fetch(url, options)
    return response
  } catch (error) {
    throw error
  }
}

// Middleware for rate limiting API routes
export function withRateLimit(handler: Function, config?: RateLimitConfig) {
  return async (req: Request) => {
    const { userId } = auth()
    const ip = req.headers.get('x-forwarded-for') || 'unknown'

    if (userId && isRateLimited(userId, 'user', config)) {
      return new Response('Rate limit exceeded for user', { status: 429 })
    }

    if (isRateLimited(ip, 'ip', config)) {
      return new Response('Rate limit exceeded for IP', { status: 429 })
    }

    return handler(req)
  }
} 