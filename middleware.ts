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

// Define routes accessible only by admins
const adminRoutes = createRouteMatcher([
  "/admin(.*)"
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
  // 1. Check if it's an admin route first
  if (adminRoutes(req)) {
    // Protect admin routes, requiring the 'admin' role
    auth().protect((has) => has({ role: 'admin' }));
    // If protect() doesn't throw/redirect, proceed to rate limiting for API routes
  }

  // 2. Check if the request is for an API route (rate limiting)
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitType = getRateLimitType(req.nextUrl.pathname)

    // Use the auth context provided by Clerk middleware; avoid calling auth() inside the limiter
    const { userId } = auth();
    const identifier = rateLimitType === 'anonymous' ? undefined : (userId ?? req.ip ?? '127.0.0.1');

    const rateLimitResult = await rateLimit({ type: rateLimitType, identifier })

    if (!rateLimitResult.success) {
      console.warn(`Rate limit exceeded for ${rateLimitType} user`, {
        pathname: req.nextUrl.pathname,
        ip: req.ip,
        userId: userId ?? null,
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        reset: new Date(rateLimitResult.reset * 1000).toISOString(),
      });

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

  // 3. Protect non-public routes if they aren't admin routes (already handled)
  if (!publicRoutes(req) && !adminRoutes(req)) {
    auth().protect()
  }

  // 4. Allow the request to proceed if no protection rules applied or passed
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
