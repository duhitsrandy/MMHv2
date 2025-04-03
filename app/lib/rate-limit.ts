// Enhanced rate limiter with per-user and IP-based limiting
import { auth } from "@clerk/nextjs/server"
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

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
  const headers = options?.headers as Record<string, string> | undefined
  const ip = headers?.['x-forwarded-for'] || 'unknown'
  
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

// Create a new ratelimiter that allows 10 requests per 10 seconds
export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
  prefix: 'ratelimit',
});

// Helper function to check rate limit
export async function checkRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);
  
  return {
    success,
    limit,
    reset,
    remaining,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
    },
  };
} 