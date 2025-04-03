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

// Combine auth middleware with rate limiting
export default clerkMiddleware(async (auth, req) => {
  // Check if the request is for an API route
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // Apply rate limiting
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

  if (!publicRoutes(req)) {
    await auth().protect()
  }
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
