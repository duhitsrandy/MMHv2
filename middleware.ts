/*
<ai_context>
Contains middleware for protecting routes, checking user authentication, and redirecting as needed.
</ai_context>
*/

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

// Define which routes are public (can be accessed without authentication)
const publicRoutes = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  "/meet-me-halfway",
  "/about",
  "/pricing",
  "/contact",
  "/api/(.*)"
])

// Define rate limit types for different API routes
const RATE_LIMIT_TYPES: Record<string, 'anonymous' | 'authenticated' | 'special'> = {
  GEOCODING: 'special', // Higher limits for geocoding
  ROUTE_CALCULATION: 'special', // Higher limits for route calculations
  POI_SEARCH: 'authenticated', // Medium limits for POI searches
  DEFAULT: 'anonymous' // Lower limits for other API routes
}

// Get rate limit type based on the API route
function getRateLimitType(pathname: string): 'anonymous' | 'authenticated' | 'special' {
  if (pathname.includes('/api/geocode')) {
    return RATE_LIMIT_TYPES.GEOCODING
  }
  if (pathname.includes('/api/route')) {
    return RATE_LIMIT_TYPES.ROUTE_CALCULATION
  }
  if (pathname.includes('/api/poi')) {
    return RATE_LIMIT_TYPES.POI_SEARCH
  }
  return RATE_LIMIT_TYPES.DEFAULT
}

// Combine auth middleware with rate limiting
export default clerkMiddleware(async (auth, req) => {
  // Check if the request is for an API route
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // Get the appropriate rate limit type based on the route
    const rateLimitType = getRateLimitType(req.nextUrl.pathname)
    
    // Apply rate limiting with the specific type
    const rateLimitResult = await rateLimit({ type: rateLimitType })
    
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
          'X-RateLimit-Type': rateLimitType,
        },
      })
    }
  }

  if (!publicRoutes(req)) {
    await auth().protect()
  }
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
