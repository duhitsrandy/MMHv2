# Rate Limiting Documentation

## Overview
The Meet Me Halfway application implements a comprehensive rate limiting system using Upstash Redis (`@upstash/ratelimit`) to protect API endpoints and ensure fair usage of resources. The system supports different rate limits for anonymous users, authenticated users, and specific high-traffic API routes.

## Rate Limiting Setup Checklist (From Scratch)
1. Set all required environment variables (see `.env.example`)
2. Create an Upstash Redis database and obtain REST URL/token
3. Configure rate limit values in `.env.local` as needed
4. Integrate the `rateLimit` function in `lib/rate-limit.ts` and middleware
5. Test rate limiting by making rapid API requests and observing 429 responses
6. Monitor usage in the Upstash dashboard and PostHog (see below)

## Monitoring Rate Limit Usage
- **Upstash Dashboard:**
  - Log in to Upstash and view your Redis database analytics for request counts, errors, and usage patterns.
  - Monitor for spikes or unusual activity.
- **PostHog Events:**
  - Rate limit warnings and violations are tracked as events in PostHog (see [MONITORING.md](MONITORING.md)).
  - Filter for `api_error` events with `status: 429` or custom `rateLimit` properties.
- **Server Logs:**
  - Rate limit violations are logged in the server logs and (optionally) in `logs/warnings.log`.
  - Look for `[Rate Limit]` or `[POI Search] Overpass API Error 429` messages.

## Troubleshooting Rate Limiting
- **Issue:** Receiving 429 Too Many Requests
  - **Solution:** Slow down requests, check rate limit headers (`X-RateLimit-Remaining`), and review Upstash/PostHog dashboards.
- **Issue:** Rate limiting not working as expected
  - **Solution:** Check environment variables, ensure Upstash credentials are correct, and verify middleware integration.
- **Issue:** All users are rate limited too quickly
  - **Solution:** Adjust rate limit values in `.env.local` to better match expected traffic.
- **Issue:** Upstash errors or downtime
  - **Solution:** Check Upstash status, retry requests, and consider fallback logic if needed.

## Environment Variables
```env
# Upstash Redis for Rate Limiting
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Rate Limiting Configuration
RATE_LIMIT_REQUESTS=10 # Max requests per window (anonymous)
RATE_LIMIT_WINDOW=10 # Window in seconds (anonymous)
RATE_LIMIT_REQUESTS_AUTH=50 # Max requests per window (authenticated)
RATE_LIMIT_WINDOW_AUTH=60 # Window in seconds (authenticated)
RATE_LIMIT_REQUESTS_SPECIAL=100 # Max requests per window (special endpoints)
RATE_LIMIT_WINDOW_SPECIAL=60 # Window in seconds (special endpoints)
```

## Cross-References
- [Authentication & Authorization](auth-docs.md)
- [Monitoring & Analytics](MONITORING.md)
- [Production Checklist](PRODUCTION.md)
- [API Docs](api-docs.md)

## Example Usage
// ... (existing code and examples remain unchanged) ...

## Implementation Details

### 1. Rate Limiter Configuration (`lib/rate-limit.ts`)
The core logic resides in `lib/rate-limit.ts`, which defines different rate limit configurations and creates corresponding `@upstash/ratelimit` instances.

#### Environment Variables
These environment variables control the rate limits:
```env
# Rate Limiting Configuration
RATE_LIMIT_REQUESTS=10        # Anonymous requests per window
RATE_LIMIT_WINDOW=10          # Anonymous window in seconds (Defaults to 10s)
RATE_LIMIT_REQUESTS_AUTH=50   # Authenticated requests per window
RATE_LIMIT_WINDOW_AUTH=60     # Authenticated window in seconds (Defaults to 60s)
RATE_LIMIT_REQUESTS_SPECIAL=100 # Special endpoint requests per window
RATE_LIMIT_WINDOW_SPECIAL=60  # Special endpoint window in seconds (Defaults to 60s)

# Upstash Redis Configuration (Ensure these are set)
UPSTASH_REDIS_REST_URL=your-upstash-redis-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token
```

#### Rate Limiter Setup
The code defines configurations and initializes rate limiters:
```typescript
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { headers } from 'next/headers'
import { auth } from '@clerk/nextjs/server'

// Define different rate limits from environment variables
const RATE_LIMITS = {
  anonymous: {
    requests: Number(process.env.RATE_LIMIT_REQUESTS) || 10,
    window: `${process.env.RATE_LIMIT_WINDOW || 10} s` as any // Default 10 seconds
  },
  authenticated: {
    requests: Number(process.env.RATE_LIMIT_REQUESTS_AUTH) || 50,
    window: `${process.env.RATE_LIMIT_WINDOW_AUTH || 60} s` as any // Default 60 seconds
  },
  special: {
    requests: Number(process.env.RATE_LIMIT_REQUESTS_SPECIAL) || 100,
    window: `${process.env.RATE_LIMIT_WINDOW_SPECIAL || 60} s` as any // Default 60 seconds
  }
}

// Create rate limiters for different scenarios using Upstash prefixes
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

// The core rate limiting function
export async function rateLimit(options?: {
  type?: 'anonymous' | 'authenticated' | 'special'
  identifier?: string // Optional explicit identifier
}) { 
  // ... implementation details ... 
}
```

#### User Identification Logic
The `rateLimit` function determines the unique identifier for applying the limit in the following order:
1.  **Explicit Identifier:** If an `identifier` is passed in the `options` (e.g., a specific API key or session ID).
2.  **Authenticated User ID:** If no explicit identifier is provided, it attempts to get the `userId` from `auth()` (Clerk). This links the limit to the logged-in user.
3.  **IP Address:** If the user is not authenticated (no `userId`), it falls back to using the client's IP address (`x-forwarded-for` header or '127.0.0.1').

### 2. Middleware Integration (`middleware.ts`)
Rate limiting for API routes is primarily enforced within the application's middleware.

#### Rate Limiting Logic in Middleware
```typescript
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

// ... (publicRoutes definition) ...

// Define rate limit types for specific API functionalities
const RATE_LIMIT_TYPES: Record<string, 'anonymous' | 'authenticated' | 'special'> = {
  GEOCODING: 'special',
  ROUTE_CALCULATION: 'special',
  POI_SEARCH: 'authenticated',
  DEFAULT: 'anonymous' 
}

// Function to determine the correct limit type based on path
function getRateLimitType(pathname: string): 'anonymous' | 'authenticated' | 'special' {
  if (pathname.includes('/api/geocode')) return RATE_LIMIT_TYPES.GEOCODING
  if (pathname.includes('/api/route')) return RATE_LIMIT_TYPES.ROUTE_CALCULATION
  if (pathname.includes('/api/poi')) return RATE_LIMIT_TYPES.POI_SEARCH
  return RATE_LIMIT_TYPES.DEFAULT
}

// Middleware implementation
export default clerkMiddleware(async (auth, req) => {
  // Apply rate limiting only to API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitType = getRateLimitType(req.nextUrl.pathname)
    
    // Call the central rateLimit function
    const rateLimitResult = await rateLimit({ type: rateLimitType })
    
    // If limit is exceeded, return 429 response
    if (!rateLimitResult.success) {
      return new NextResponse(JSON.stringify({
        error: rateLimitResult.message,
        limit: rateLimitResult.limit,
        reset: rateLimitResult.reset,
        remaining: rateLimitResult.remaining,
      }), {
        status: 429, // Too Many Requests
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          'X-RateLimit-Type': rateLimitType, // Include the applied limit type
        },
      })
    }
  }

  // ... (rest of middleware logic for public/protected routes) ...
})

// ... (middleware config) ...
```

### 3. Rate Limit Types & Defaults

1.  **Anonymous Rate Limit (`anonymous`)**
    *   Default: 10 requests per 10 seconds (`RATE_LIMIT_REQUESTS`, `RATE_LIMIT_WINDOW`).
    *   Applies to unauthenticated users (identified by IP address) or as the default for API routes not otherwise specified.
    *   Used for general public API access.

2.  **Authenticated Rate Limit (`authenticated`)**
    *   Default: 50 requests per 60 seconds (`RATE_LIMIT_REQUESTS_AUTH`, `RATE_LIMIT_WINDOW_AUTH`).
    *   Applies to authenticated users (identified by Clerk `userId`).
    *   Used for API routes like POI search (`/api/poi`).

3.  **Special Rate Limit (`special`)**
    *   Default: 100 requests per 60 seconds (`RATE_LIMIT_REQUESTS_SPECIAL`, `RATE_LIMIT_WINDOW_SPECIAL`).
    *   Applies to specific high-traffic or resource-intensive endpoints.
    *   Used for geocoding (`/api/geocode`) and route calculation (`/api/route`).

### 4. Usage Examples

#### API Route (Implicit via Middleware)
For most API routes, rate limiting is handled automatically by the middleware as shown above. You generally don't need to call `rateLimit` directly within the API route handlers unless you need custom logic or a different identifier.

#### Server Action with Rate Limiting
If you need to rate-limit a Server Action, you can call the `rateLimit` function directly:
```typescript
'use server'

import { rateLimit } from "@/lib/rate-limit"
import { auth } from "@clerk/nextjs/server"

export async function someAction(formData: FormData) {
  const { userId } = auth() // Get user ID if applicable

  // Apply authenticated limit, identifying by userId if available
  const rateLimitResult = await rateLimit({ 
    type: 'authenticated', 
    identifier: userId ?? undefined // Pass userId if logged in
  })
  
  if (!rateLimitResult.success) {
    // Return an error object or throw an error
    return { 
      error: "Too many requests for this action.",
      // Optionally include limit details if needed by the UI
      limit: rateLimitResult.limit,
      remaining: rateLimitResult.remaining,
      reset: rateLimitResult.reset
    }
  }

  // Process the action...
  console.log("Action allowed")
  return { success: true }
}
```
*Note: This example applies the 'authenticated' limit. Choose the appropriate type based on the action's requirements.* 

### 5. Response Headers
When a request is rate-limited (429 response), the following headers are included by the middleware:
*   `X-RateLimit-Limit`: Maximum number of requests allowed in the window.
*   `X-RateLimit-Remaining`: Number of requests remaining in the current window.
*   `X-RateLimit-Reset`: Unix timestamp (in seconds) when the rate limit window resets.
*   `X-RateLimit-Type`: The type of rate limit applied (`anonymous`, `authenticated`, or `special`).

### 6. Error Handling
Rate limit violations trigger:
*   **HTTP Status Code:** 429 (Too Many Requests)
*   **JSON Response Body:**
    ```json
    {
      "error": "Too many requests",
      "limit": 10, 
      "reset": 1678886400,
      "remaining": 0
    }
    ```

### 7. Best Practices

1.  **Configuration**
    *   Set appropriate limits based on expected usage for anonymous, authenticated, and special endpoints.
    *   Use environment variables for easy adjustment.
    *   Monitor Upstash analytics and application logs to fine-tune limits.

2.  **Implementation**
    *   Apply rate limiting early, typically in middleware for API routes.
    *   Ensure the identifier logic correctly distinguishes users/IPs.
    *   Provide informative 429 responses with standard headers.
    *   Log rate limit violations for monitoring.

3.  **Monitoring**
    *   Utilize Upstash Redis analytics dashboard.
    *   Monitor application logs for 429 errors.
    *   Set up alerts for excessive rate limiting or potential abuse patterns.

### 8. Troubleshooting

Common issues and solutions:
1.  **Redis Connection Issues**
    *   Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` environment variables are correctly set and accessible by the application.
    *   Check network connectivity between the application server and Upstash.
    *   Monitor Upstash Redis instance health via their dashboard.

2.  **Incorrect Rate Limit Applied**
    *   Verify the logic in `getRateLimitType` in `middleware.ts` correctly maps paths to limit types.
    *   Check the `X-RateLimit-Type` header in 429 responses.
    *   Ensure environment variables for limits/windows are correctly parsed (they should be numbers).

3.  **Performance Impact**
    *   Each rate-limited request involves a call to Redis. Monitor latency via Upstash.
    *   Ensure Redis instance is appropriately sized.
    *   Rate limiting is generally very fast, but extreme traffic might warrant further investigation.

This documentation provides a comprehensive guide to the rate limiting system implemented using `@upstash/ratelimit` in the Meet Me Halfway application. 