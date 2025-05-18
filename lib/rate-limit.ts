import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { headers } from 'next/headers'
import { auth } from '@clerk/nextjs/server'

// Define different rate limits for different scenarios
const RATE_LIMITS = {
  // Unauthenticated users get stricter limits
  anonymous: {
    requests: Number(process.env.RATE_LIMIT_REQUESTS) || 10,
    window: `${process.env.RATE_LIMIT_WINDOW || 10} s` as any
  },
  // Authenticated users get higher limits
  authenticated: {
    requests: Number(process.env.RATE_LIMIT_REQUESTS_AUTH) || 50,
    window: `${process.env.RATE_LIMIT_WINDOW_AUTH || 60} s` as any
  },
  // Special endpoints that need higher limits
  special: {
    requests: Number(process.env.RATE_LIMIT_REQUESTS_SPECIAL) || 100,
    window: `${process.env.RATE_LIMIT_WINDOW_SPECIAL || 60} s` as any
  }
}

// Create rate limiters for different scenarios
const rateLimiters = {
  anonymous: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(
      RATE_LIMITS.anonymous.requests,
      RATE_LIMITS.anonymous.window
    ),
    analytics: true,
    prefix: '@upstash/ratelimit:anonymous',
  }),
  authenticated: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(
      RATE_LIMITS.authenticated.requests,
      RATE_LIMITS.authenticated.window
    ),
    analytics: true,
    prefix: '@upstash/ratelimit:authenticated',
  }),
  special: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(
      RATE_LIMITS.special.requests,
      RATE_LIMITS.special.window
    ),
    analytics: true,
    prefix: '@upstash/ratelimit:special',
  })
}

export async function rateLimit(options?: {
  type?: 'anonymous' | 'authenticated' | 'special'
  identifier?: string
}) {
  const { type = 'anonymous', identifier } = options || {}
  
  // Get the appropriate rate limiter
  const limiter = rateLimiters[type]
  
  // Determine the identifier for rate limiting
  let id: string
  if (identifier) {
    // Use provided identifier (e.g., user ID)
    id = identifier
  } else {
    // Try to get user ID from auth *only* if not anonymous
    if (type !== 'anonymous') {
      const authResult = auth()
      if (authResult?.userId) {
        id = authResult.userId
      } else {
        // Fall back to IP if auth user but no ID (shouldn't happen often)
        id = headers().get('x-forwarded-for') ?? '127.0.0.1'
      }
    } else {
      // For anonymous type, directly use IP address
      id = headers().get('x-forwarded-for') ?? '127.0.0.1'
    }
  }

  // Apply rate limiting
  const { success, limit, reset, remaining } = await limiter.limit(id)

  if (!success) {
    return {
      success: false,
      message: 'Too many requests',
      limit,
      reset,
      remaining,
      type
    }
  }

  return {
    success: true,
    limit,
    reset,
    remaining,
    type
  }
} 