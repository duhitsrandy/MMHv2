# Rate Limiting Documentation

## Overview
The Meet Me Halfway application implements a comprehensive rate limiting system using Upstash Redis to protect API endpoints and ensure fair usage of resources. The system supports different rate limits for various user types and scenarios.

## Implementation Details

### 1. Rate Limiter Configuration (`lib/rate-limit.ts`)

#### Environment Variables
```env
# Rate Limiting Configuration
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW=60
RATE_LIMIT_REQUESTS_AUTH=50
RATE_LIMIT_WINDOW_AUTH=60
RATE_LIMIT_REQUESTS_SPECIAL=100
RATE_LIMIT_WINDOW_SPECIAL=60

# Upstash Redis Configuration
UPSTASH_REDIS_REST_URL=https://amusing-bear-18082.upstash.io
UPSTASH_REDIS_REST_TOKEN=AUaiAAIjcDE2NmEzZjczZGY2ZWE0MjBjYTNjYThhMTFkOTJlYjBiY3AxMA
```

#### Rate Limiter Types
```typescript
// General rate limiter for unauthenticated users
const generalLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(
    Number(process.env.RATE_LIMIT_REQUESTS) || 10,
    `${process.env.RATE_LIMIT_WINDOW || 60}s`
  ),
  analytics: true,
  prefix: "ratelimit:general",
})

// Rate limiter for authenticated users
const authLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(
    Number(process.env.RATE_LIMIT_REQUESTS_AUTH) || 50,
    `${process.env.RATE_LIMIT_WINDOW_AUTH || 60}s`
  ),
  analytics: true,
  prefix: "ratelimit:auth",
})

// Rate limiter for special endpoints
const specialLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(
    Number(process.env.RATE_LIMIT_REQUESTS_SPECIAL) || 100,
    `${process.env.RATE_LIMIT_WINDOW_SPECIAL || 60}s`
  ),
  analytics: true,
  prefix: "ratelimit:special",
})
```

### 2. Middleware Integration

#### Rate Limiting in Middleware
```typescript
export default clerkMiddleware(async (auth, req) => {
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitResult = await rateLimit()
    if (!rateLimitResult.success) {
      return new NextResponse(JSON.stringify({
        error: rateLimitResult.message,
        limit: rateLimitResult.limit,
        reset: rateLimitResult.reset,
        remaining: rateLimitResult.remaining,
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        },
      })
    }
  }
  // ... rest of middleware
})
```

### 3. Rate Limit Types

1. **General Rate Limit**
   - Default: 10 requests per 60 seconds
   - Applies to unauthenticated users
   - Used for public API endpoints

2. **Authenticated Rate Limit**
   - Default: 50 requests per 60 seconds
   - Applies to authenticated users
   - Higher limit than general rate limit

3. **Special Rate Limit**
   - Default: 100 requests per 60 seconds
   - Applies to specific high-priority endpoints
   - Highest limit among the three types

### 4. Usage Examples

#### API Route with Rate Limiting
```typescript
import { rateLimit } from "@/lib/rate-limit"

export async function GET(req: Request) {
  const rateLimitResult = await rateLimit({ type: 'authenticated' })
  
  if (!rateLimitResult.success) {
    return new Response("Too many requests", { 
      status: 429,
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.reset.toString(),
      }
    })
  }

  // Process request
}
```

#### Server Action with Rate Limiting
```typescript
import { rateLimit } from "@/lib/rate-limit"

export async function someAction() {
  const rateLimitResult = await rateLimit()
  
  if (!rateLimitResult.success) {
    return { 
      error: "Too many requests",
      limit: rateLimitResult.limit,
      remaining: rateLimitResult.remaining,
      reset: rateLimitResult.reset
    }
  }

  // Process action
}
```

### 5. Response Headers

Rate-limited responses include the following headers:
- `X-RateLimit-Limit`: Maximum number of requests allowed
- `X-RateLimit-Remaining`: Number of requests remaining
- `X-RateLimit-Reset`: Time until the rate limit resets (in seconds)

### 6. Error Handling

Rate limit errors return:
- Status code: 429 (Too Many Requests)
- JSON response with:
  - Error message
  - Current limit
  - Remaining requests
  - Reset time

### 7. Best Practices

1. **Configuration**
   - Set appropriate limits for each user type
   - Monitor usage patterns
   - Adjust limits based on actual usage

2. **Implementation**
   - Apply rate limiting early in request processing
   - Include rate limit headers in responses
   - Log rate limit violations

3. **Monitoring**
   - Track rate limit hits
   - Monitor Redis performance
   - Set up alerts for unusual patterns

### 8. Troubleshooting

Common issues and solutions:
1. **Redis Connection Issues**
   - Verify Redis URL and token
   - Check network connectivity
   - Monitor Redis health

2. **Rate Limit Configuration**
   - Ensure environment variables are set
   - Verify values are valid numbers
   - Check time window format

3. **Performance Impact**
   - Monitor Redis latency
   - Consider caching strategies
   - Optimize Redis queries

This documentation provides a comprehensive guide to the rate limiting system in the Meet Me Halfway application. 