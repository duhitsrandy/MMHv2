# Authentication & Authorization Documentation

## Overview
The Meet Me Halfway application uses Clerk for authentication and authorization, providing a secure and user-friendly authentication system with support for multiple authentication methods and role-based access control.

## Implementation Details

### 1. Clerk Integration

#### Provider Setup (`components/auth/auth-provider.tsx`)
The application uses a custom `AuthProvider` component that wraps Clerk's `ClerkProvider` to integrate theme settings.
```typescript
"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useTheme } from "next-themes"

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { theme } = useTheme()

  return (
    <ClerkProvider
      appearance={{
        baseTheme: theme === "dark" ? dark : undefined,
        elements: {
          formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
          footerActionLink: "text-primary hover:text-primary/90",
          card: "shadow-none",
        },
      }}
      signInUrl="/login"
      signUpUrl="/signup"
      // Redirect URLs are typically configured via environment variables
    >
      {children}
    </ClerkProvider>
  )
}
```

#### Environment Variables
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/meet-me-halfway
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/meet-me-halfway
NEXT_PUBLIC_CLERK_DEVELOPMENT_DOMAIN=localhost:3000
```

### 2. Middleware Configuration

#### Route Protection (`middleware.ts`)
The middleware (`middleware.ts`) uses `clerkMiddleware` to protect routes. It defines public routes and applies authentication checks to all others. It also integrates rate limiting for API routes.
```typescript
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit' // Assuming rate limit lib path
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

// Define public routes (accessible without login)
const publicRoutes = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  // ... other public paths like /about, /pricing ...
  "/api/(.*)" // API routes have their own checks/rate limits
])

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

export default clerkMiddleware(async (auth, req) => {
  // Apply rate limiting to API routes first
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitType = getRateLimitType(req.nextUrl.pathname)
    const rateLimitResult = await rateLimit({ type: rateLimitType })
    
    if (!rateLimitResult.success) {
      // Return 429 response if rate limited
      return new NextResponse(JSON.stringify({ /* ... error details ... */ }), {
        status: 429,
        headers: { /* ... rate limit headers ... */ }
      })
    }
    // If not rate limited, proceed (API routes might have further auth checks)
  }

  // Protect non-public routes
  if (!publicRoutes(req)) {
    await auth().protect() // Redirects to login if not authenticated
  }
  
  // Allow the request to proceed if public or authenticated
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

### 3. User Profile Management

#### Profile Schema (`db/schema/profiles-schema.ts`)
User profile information, including membership status and Stripe details, is stored in a separate Supabase table linked by the Clerk `userId`.
```typescript
import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const membershipEnum = pgEnum("membership", ["free", "pro"])

export const profilesTable = pgTable("profiles", {
  userId: text("user_id").primaryKey().notNull(), // Links to Clerk User ID
  membership: membershipEnum("membership").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertProfile = typeof profilesTable.$inferInsert
export type SelectProfile = typeof profilesTable.$inferSelect
```
*Note: Synchronization between Clerk user creation/updates and this profile table needs to be handled (e.g., via webhooks or database triggers).* 

#### API Route Protection & Rate Limiting
API routes are typically checked for authentication and rate-limited within the `middleware.ts` file, as shown in the Middleware Configuration section. 

If an API route needs to perform an *additional* authentication check beyond what the middleware provides (e.g., checking for a specific role or permission not handled by the basic `auth().protect()`), it can use the `auth()` helper:

```typescript
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { userId, sessionClaims } = auth()
  
  // Middleware already handled initial auth & rate limit for API routes.
  // You might add more specific checks here:
  if (!userId) {
    // This check might be redundant if middleware protects all non-public API routes
    return new NextResponse("Unauthorized", { status: 401 })
  }

  // Example: Check for a specific role if needed
  // if (sessionClaims?.metadata?.role !== 'admin') {
  //   return new NextResponse("Forbidden", { status: 403 })
  // }

  // Handle authorized request...
  return NextResponse.json({ message: `Hello user ${userId}` })
}
```
*Key Point: For most API routes, the primary authentication enforcement and rate limiting happens in the middleware. Direct checks within the route handler are for more granular authorization or when middleware protection is bypassed.* 

### 4. Authentication Flow

1. **Initial Setup**
   - Clerk provider wraps the application
   - Theme integration configured
   - Public routes defined

2. **User Authentication**
   - Sign in/sign up pages available
   - Multiple authentication methods supported
   - Session management handled by Clerk

3. **Route Protection**
   - Middleware checks authentication status
   - Public routes accessible without auth
   - Protected routes require authentication
   - API routes protected with rate limiting

4. **Profile Management**
   - User profiles stored in Supabase
   - Membership status tracked
   - Subscription information maintained

### 5. Security Measures

1. **Session Security**
   - Secure session handling
   - Token-based authentication
   - Session expiration management

2. **API Protection**
   - Rate limiting on API routes
   - Authentication checks
   - Error handling

3. **Data Protection**
   - Secure profile storage
   - Encrypted credentials
   - Access control

### 6. Integration Points

1. **Theme System**
   - Dark/light mode support
   - Clerk appearance customization
   - Consistent UI across auth flows

2. **Database**
   - Profile data storage
   - Membership tracking
   - User preferences

3. **Payment System**
   - Subscription management
   - Membership upgrades
   - Payment processing

### 7. Usage Examples

#### Protected Route Component
```typescript
import { auth } from "@clerk/nextjs"

export default async function ProtectedPage() {
  const { userId } = auth()
  
  if (!userId) {
    return <div>Please sign in to access this page</div>
  }

  return <div>Protected Content</div>
}
```

#### API Route Protection
```typescript
import { auth } from "@clerk/nextjs"
import { rateLimit } from "@/lib/rate-limit"

export async function GET(req: Request) {
  const { userId } = auth()
  
  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const rateLimitResult = await rateLimit({ type: 'authenticated' })
  if (!rateLimitResult.success) {
    return new Response("Too many requests", { status: 429 })
  }

  // Handle request
}
```

### 8. Best Practices

1. **Security**
   - Always validate user sessions
   - Use rate limiting for API routes
   - Implement proper error handling
   - Follow least privilege principle

2. **User Experience**
   - Provide clear authentication flows
   - Handle errors gracefully
   - Maintain consistent UI
   - Support multiple auth methods

3. **Development**
   - Test authentication flows
   - Monitor rate limits
   - Log security events
   - Keep dependencies updated

This documentation provides a comprehensive guide to the authentication and authorization system in the Meet Me Halfway application. 