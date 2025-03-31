/*
<ai_context>
Contains middleware for protecting routes, checking user authentication, and redirecting as needed.
</ai_context>
*/

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

export default clerkMiddleware(async (auth, req) => {
  if (!publicRoutes(req)) {
    await auth().protect()
  }
})

export const config = {
  matcher: [
    "/(.*?trpc.*?|(?!static|.*\\..*|_next|favicon.ico).*)",
    "/"
  ]
}
