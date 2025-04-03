# Authentication & Authorization Documentation

## Overview
The Meet Me Halfway application uses Clerk for authentication and authorization, providing a secure and user-friendly authentication system with support for multiple authentication methods and role-based access control.

## Implementation Details

### 1. Clerk Integration

#### Provider Setup (`components/auth/auth-provider.tsx`)
```typescript
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
```typescript
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

  if (!publicRoutes(req)) {
    await auth().protect()
  }
  return NextResponse.next()
})
```

### 3. User Profile Management

#### Profile Schema (`db/schema/profiles-schema.ts`)
```typescript
export const membershipEnum = pgEnum("membership", ["free", "pro"])

export const profilesTable = pgTable("profiles", {
  userId: text("user_id").primaryKey().notNull(),
  membership: membershipEnum("membership").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})
```

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