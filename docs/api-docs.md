# API Documentation

## Overview
The Meet Me Halfway application integrates with several external APIs for geocoding, routing, and points of interest services. This documentation covers the API endpoints, request/response formats, authentication, error handling, and integration details.

**Key Features:**
- Multi-origin support (2-10 locations based on subscription tier)
- Tier-based API access (ORS for Free/Plus, HERE API for Pro/Business)
- Real-time traffic data for Pro subscribers
- Comprehensive subscription and billing system
- Advanced POI search and travel time calculations

## API Setup Checklist (From Scratch)
1. Set up all required environment variables (see `.env.example`)
2. Ensure Supabase, Clerk, Upstash, LocationIQ, **Fast Routing OSRM (RapidAPI)**, OpenRouteService, HERE API, Stripe, and PostHog accounts are configured
3. Run database migrations (`npm run db:migrate`)
4. Configure Stripe products and pricing
5. Set up webhook endpoints for Stripe
6. Start the development server (`npm run dev`)
7. Test endpoints using curl, Postman, or the provided examples below
8. Review [auth-docs.md](auth-docs.md), [rate-limit-docs.md](rate-limit-docs.md), [SUBSCRIPTION_BILLING.md](SUBSCRIPTION_BILLING.md), and [MONITORING.md](MONITORING.md) for security, rate limiting, billing, and analytics details

## Authentication & Authorization
- Most API endpoints require authentication via Clerk (see [auth-docs.md](auth-docs.md)).
- Some endpoints are public, but rate-limited.
- Use the `Authorization` header with a valid Clerk session token for protected endpoints.
- Rate limiting is enforced on all endpoints (see [rate-limit-docs.md](rate-limit-docs.md)).

## Endpoints

### 1. Geocoding (`geocodeLocationAction`)
**Description:** Convert an address to coordinates using LocationIQ.
**Auth:** Required (Clerk)
**Rate Limit:** Special (see ENV)

#### Request Example (curl):
```bash
curl -X POST https://yourdomain.com/api/geocode \
  -H 'Authorization: Bearer <clerk_token>' \
  -H 'Content-Type: application/json' \
  -d '{"location": "New York, NY"}'
```
#### Request Example (fetch):
```js
fetch('/api/geocode', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <clerk_token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ location: 'New York, NY' })
})
```
#### Response Example (JSON):
```json
{
  "isSuccess": true,
  "message": "Location geocoded successfully",
  "data": {
    "lat": "40.7128",
    "lon": "-74.0060",
    "display_name": "New York, NY, USA"
  }
}
```

### 2. POI Search (`searchPoisAction`)
**Description:** Find points of interest around a location.
**Auth:** Required (Clerk)
**Rate Limit:** Authenticated

#### Request Example (curl):
```bash
curl -X POST https://yourdomain.com/api/poi \
  -H 'Authorization: Bearer <clerk_token>' \
  -H 'Content-Type: application/json' \
  -d '{"lat": "40.7128", "lon": "-74.0060", "radius": 1000}'
```
#### Response Example (JSON):
```json
{
  "isSuccess": true,
  "message": "Successfully found points of interest",
  "data": [
    {
      "id": "123456",
      "name": "Central Park",
      "type": "park",
      "lat": "40.7851",
      "lon": "-73.9683",
      "address": { "city": "New York", "country": "USA" },
      "tags": { "amenity": "park" }
    }
  ]
}
```

### 3. Main Route (`getRouteAction`)
**Description:** Calculate the main driving route between two points using **Fast Routing OSRM (RapidAPI)**.
**Auth:** Required (Clerk)
**Rate Limit:** Special

#### Request Example (curl):
```bash
curl -X POST https://yourdomain.com/api/route \
  -H 'Authorization: Bearer <clerk_token>' \
  -H 'Content-Type: application/json' \
  -d '{"start": {"lat": "40.7128", "lon": "-74.0060"}, "end": {"lat": "40.7306", "lon": "-73.9352"}}'
```
#### Response Example (JSON):
```json
{
  "isSuccess": true,
  "message": "Route calculated successfully",
  "data": {
    "distance": 5000,
    "duration": 900,
    "geometry": { "coordinates": [[-74.0060, 40.7128], [-73.9352, 40.7306]], "type": "LineString" },
    "serviceUsed": "FastRoutingOSRM"
  }
}
```

### 4. Alternate Routes (`getAlternateRouteAction`)
**Description:** Get alternate driving routes between two points using **Fast Routing OSRM (RapidAPI)**. Falls back to ORS if unavailable.
**Auth:** Required (Clerk)
**Rate Limit:** Special

#### Request Example (curl):
```bash
curl -X POST https://yourdomain.com/api/route/alternate \
  -H 'Authorization: Bearer <clerk_token>' \
  -H 'Content-Type: application/json' \
  -d '{"start": {"lat": "40.7128", "lon": "-74.0060"}, "end": {"lat": "40.7306", "lon": "-73.9352"}}'
```
#### Response Example (JSON):
```json
{
  "isSuccess": true,
  "message": "Alternate route calculated successfully",
  "data": {
    "distance": 5200,
    "duration": 950,
    "geometry": { "coordinates": [[-74.0060, 40.7128], [-73.9352, 40.7306]], "type": "LineString" },
    "serviceUsed": "FastRoutingOSRM",
    "usedFallback": false
  }
}
```

### 5. Travel Time Matrix (ORS - Free Tier) (`getTravelTimeMatrixAction`)
**Description:** Calculate travel times between multiple points using **OpenRouteService** (ORS Matrix API). Used for Free Tier users.
**Auth:** Required (Clerk)
**Rate Limit:** Authenticated

#### Request Example (curl):
```bash
curl -X POST https://yourdomain.com/api/travel-time-matrix \
  -H 'Authorization: Bearer <clerk_token>' \
  -H 'Content-Type: application/json' \
  -d '{"sources": [{"lat": "40.7128", "lon": "-74.0060"}], "destinations": [{"lat": "40.7851", "lon": "-73.9683"}]}'
```
#### Response Example (JSON):
```json
{
  "isSuccess": true,
  "message": "Travel time matrix calculated successfully",
  "data": {
    "durations": [[900]],
    "distances": [[5000]]
  }
}
```

### 6. Traffic Travel Time Matrix (HERE API - Pro Tier) (`getTrafficMatrixHereAction`)
**Description:** Calculate travel times and distances between multiple points using the **HERE Matrix API v8**, including real-time traffic. Used for Pro Tier users.
**Auth:** Required (Clerk, and `requireProPlan` is enforced within the action)
**Rate Limit:** Authenticated (actual API call subject to HERE API limits)

#### Request Parameters (passed to action):
```typescript
interface HereMatrixActionParams {
  origins: Array<{ lat: number; lng: number }>;
  destinations: Array<{ lat: number; lng: number }>;
}
```

#### Response Example (from action):
```json
{
  "success": true,
  "error": null,
  "data": {
    "travelTimes": [[2832, 2431], [3201, 2899]], // Example: travelTimes[originIndex][destinationIndex] in seconds
    "distances": [[45000, 42000], [48000, 46000]]  // Example: distances[originIndex][destinationIndex] in meters
  }
}
```

### 7. Stripe Checkout Session (`createCheckoutSessionAction`)
**Description:** Create a Stripe checkout session for subscription upgrades.
**Auth:** Required (Clerk)
**Rate Limit:** Authenticated

#### Request Example (curl):
```bash
curl -X POST https://yourdomain.com/api/stripe/checkout \
  -H 'Authorization: Bearer <clerk_token>' \
  -H 'Content-Type: application/json' \
  -d '{"priceId": "price_1234567890"}'
```

#### Response Example (JSON):
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

### 8. Stripe Billing Portal (`createBillingPortalSessionAction`)
**Description:** Create a Stripe billing portal session for subscription management.
**Auth:** Required (Clerk)
**Rate Limit:** Authenticated

#### Request Example (curl):
```bash
curl -X POST https://yourdomain.com/api/stripe/billing-portal \
  -H 'Authorization: Bearer <clerk_token>' \
  -H 'Content-Type: application/json'
```

#### Response Example (JSON):
```json
{
  "success": true,
  "url": "https://billing.stripe.com/session/..."
}
```

### 9. User Plan Information (`getUserPlanInfoAction`)
**Description:** Get current user's subscription plan and limits.
**Auth:** Required (Clerk)
**Rate Limit:** Authenticated

#### Response Example (JSON):
```json
{
  "success": true,
  "data": {
    "membership": "pro",
    "maxLocations": 5,
    "hasTrafficData": true,
    "stripeCustomerId": "cus_...",
    "stripeSubscriptionId": "sub_..."
  }
}
```

## Error Handling

### Error Response Format
```json
{
  "isSuccess": false,
  "message": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes
- `400`: Bad Request (invalid input)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource does not exist)
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error (unexpected failure)

### Troubleshooting
- Check the response `message` and `code` for details
- For 401/403 errors, ensure you are authenticated and have the right permissions
- For 429 errors, review rate limit headers and slow down requests
- For 500 errors, check server logs and [MONITORING.md](MONITORING.md)

## API Testing
- Use curl, Postman, or the provided fetch examples to test endpoints
- Automated tests can be added in the `__tests__/` directory or alongside actions/components
- See [README.md](README.md) for general testing instructions

## Webhook Endpoints

### 1. Stripe Webhooks (`/api/stripe/webhooks`)
**Description:** Handle Stripe subscription events for billing automation.
**Auth:** Stripe webhook signature verification
**Events Handled:**
- `checkout.session.completed`: New subscription created
- `customer.subscription.updated`: Subscription modified
- `customer.subscription.deleted`: Subscription cancelled

#### Webhook Configuration
```bash
# Stripe CLI for testing
stripe listen --forward-to localhost:3000/api/stripe/webhooks

# Production webhook endpoint
https://yourdomain.com/api/stripe/webhooks
```

### 2. Clerk Webhooks (`/api/webhooks/clerk`)
**Description:** Handle user lifecycle events from Clerk authentication.
**Auth:** Clerk webhook signature verification
**Events Handled:**
- `user.created`: Create user profile in database
- `user.updated`: Update user profile information
- `user.deleted`: Clean up user data

## Cross-References
- [Authentication & Authorization](auth-docs.md)
- [Rate Limiting](rate-limit-docs.md)
- [Subscription & Billing](SUBSCRIPTION_BILLING.md)
- [HERE API Integration](HERE_API_INTEGRATION.md)
- [Multi-Origin Feature](MULTI_ORIGIN_FEATURE.md)
- [Upgrade Modal Implementation](UPGRADE_MODAL_IMPLEMENTATION.md)
- [Monitoring & Analytics](MONITORING.md)
- [Production Checklist](PRODUCTION.md)
- [Potential Future Features](POTENTIAL_FUTURE_FEATURES.md)

## External APIs

### 1. LocationIQ API

#### Geocoding (`geocodeLocationAction`)
```typescript
export async function geocodeLocationAction(
  location: string
): Promise<ActionState<GeocodeResponse>> {
  // Implementation
}
```

**Request Format:**
```typescript
interface GeocodeRequest {
  location: string;
}
```

**Response Format:**
```typescript
interface GeocodeResponse {
  lat: number;
  lon: number;
  display_name: string;
  address: {
    city?: string;
    state?: string;
    country?: string;
  };
}
```

#### POI Search (`searchPoisAction`)
```typescript
export async function searchPoisAction(
  lat: number,
  lon: number,
  radius: number = 1000
): Promise<ActionState<PoiResponse[]>> {
  // Implementation
}
```

**Request Format:**
```typescript
interface PoiSearchRequest {
  lat: number;
  lon: number;
  radius?: number;
}
```

**Response Format:**
```typescript
interface PoiResponse {
  place_id: string;
  lat: number;
  lon: number;
  display_name: string;
  type: string;
  address: {
    city?: string;
    state?: string;
    country?: string;
  };
}
```

### 2. OSRM API

#### Main Route (`getRouteAction`)
```typescript
export async function getRouteAction(
  start: { lat: number; lon: number },
  end: { lat: number; lon: number }
): Promise<ActionState<RouteResponse>> {
  // Implementation
}
```

**Request Format:**
```typescript
interface RouteRequest {
  start: {
    lat: number;
    lon: number;
  };
  end: {
    lat: number;
    lon: number;
  };
}
```

**Response Format:**
```typescript
interface RouteResponse {
  routes: Array<{
    geometry: string;
    distance: number;
    duration: number;
    legs: Array<{
      steps: Array<{
        geometry: string;
        distance: number;
        duration: number;
      }>;
    }>;
  }>;
}
```

#### Alternate Routes (`getAlternateRouteAction`)
```typescript
export async function getAlternateRouteAction(
  start: { lat: number; lon: number },
  end: { lat: number; lon: number }
): Promise<ActionState<RouteResponse | null>> {
  // Implementation
}
```

### 3. OpenRouteService API

#### Travel Time Matrix (Free Tier) (`getTravelTimeMatrixAction`)
```typescript
export async function getTravelTimeMatrixAction(
  sources: Array<{ lat: number; lon: number }>,
  destinations: Array<{ lat: number; lon: number }>
): Promise<ActionState<TravelTimeMatrixResponse>> {
  // Implementation
}
```

**Request Format:**
```typescript
interface TravelTimeMatrixRequest {
  sources: Array<{
    lat: number;
    lon: number;
  }>;
  destinations: Array<{
    lat: number;
    lon: number;
  }>;
}
```

**Response Format:**
```typescript
interface TravelTimeMatrixResponse {
  durations: number[][];
  distances: number[][];
}
```

### 4. HERE API

#### Traffic Travel Time Matrix (Pro Tier) (`getTrafficMatrixHereAction`)

See `app/actions/here-actions.ts` for the action definition and `lib/providers/here-platform.ts` for the direct API call wrapper (`getTravelTimeMatrixHere`).

**Action Request Parameters:**
```typescript
interface HereMatrixActionParams {
  origins: Array<{ lat: number; lng: number }>;
  destinations: Array<{ lat: number; lng: number }>;
}
```

**Action Response Data (on success):**
```typescript
interface ProcessedHereMatrixResponse {
  travelTimes: (number | null)[][];
  distances: (number | null)[][];
}
```
**Notes:**
- The HERE Matrix API is used for Pro Tier users to provide traffic-aware travel times and distances.
- The `getTrafficMatrixHereAction` server action is protected by `requireProPlan()`.
- The direct API call (`getTravelTimeMatrixHere`) in the provider constructs a request body including origins, destinations, `regionDefinition: { type: "world" }`, `routingMode: "fast"`, `transportMode: "car"`, and `matrixAttributes: ["travelTimes", "distances"]`. Departure time is omitted to default to "now" for live traffic.

## Backend Logic (Server Actions)

Backend operations, including interactions with the external APIs documented above and database operations (using Drizzle with Supabase), are primarily handled via **Next.js Server Actions**. These actions are defined in the `actions/` directory (e.g., `locationiq-actions.ts`, `ors-actions.ts`) and can be called directly from React Server Components or Client Components.

Refer to the `app-structure.md` document and the files within the `actions/` directory for detailed information on specific Server Actions and their functionality.

## Rate Limiting

### 1. Rate Limit Configuration
```typescript
const generalLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(
    Number(process.env.RATE_LIMIT_REQUESTS) || 10,
    `${process.env.RATE_LIMIT_WINDOW || 60}s`
  ),
  analytics: true,
  prefix: "ratelimit:general",
})
```

### 2. Rate Limit Headers
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time until reset

## Error Handling

### 1. Error Response Format
```typescript
interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
}
```

### 2. Common Error Codes
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## Environment Variables

### Core API Keys
```env
# LocationIQ (Geocoding & POI Search)
NEXT_PUBLIC_LOCATIONIQ_KEY=your_locationiq_key

# Fast Routing OSRM (RapidAPI)
RAPIDAPI_FAST_ROUTING_HOST=fast-routing.p.rapidapi.com
RAPIDAPI_FAST_ROUTING_KEY=your_rapidapi_key

# OpenRouteService (Free/Plus Tier Matrix)
OPENROUTESERVICE_API_KEY=your_ors_key

# HERE API (Pro/Business Tier Matrix with Traffic)
HERE_API_KEY=your_here_api_key
```

### Database & Authentication
```env
# Supabase
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/meet-me-halfway
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/meet-me-halfway
```

### Stripe (Subscription & Billing)
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_... # or sk_test_ for development
STRIPE_WEBHOOK_SECRET=whsec_...

# Plus Tier Price IDs
STRIPE_PRICE_PLUS_WEEKLY=price_...
STRIPE_PRICE_PLUS_MONTHLY=price_...
STRIPE_PRICE_PLUS_YEARLY=price_...

# Pro Tier Price IDs
STRIPE_PRICE_PRO_WEEKLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...

# Business Tier Price IDs
STRIPE_PRICE_BUSINESS_WEEKLY=price_...
STRIPE_PRICE_BUSINESS_MONTHLY=price_...
STRIPE_PRICE_BUSINESS_YEARLY=price_...
```

### Rate Limiting (Upstash Redis)
```env
# Upstash Redis
UPSTASH_REDIS_URL=redis://...
UPSTASH_REDIS_TOKEN=...

# Rate Limit Configuration
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW=60
RATE_LIMIT_REQUESTS_AUTH=50
RATE_LIMIT_WINDOW_AUTH=60
RATE_LIMIT_REQUESTS_SPECIAL=100
RATE_LIMIT_WINDOW_SPECIAL=60
```

### Analytics & Monitoring
```env
# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## Best Practices

### 1. API Integration
- Use environment variables for API keys
- Implement proper error handling
- Add request validation
- Use rate limiting

### 2. Response Handling
- Validate response data
- Handle edge cases
- Implement retry logic
- Cache responses when appropriate

### 3. Security
- Protect sensitive endpoints
- Validate user input
- Sanitize response data
- Monitor API usage

## Testing

### 1. API Tests
```typescript
describe("API Integration", () => {
  test("geocodeLocationAction", async () => {
    // Test implementation
  });

  test("searchPoisAction", async () => {
    // Test implementation
  });

  test("getRouteAction", async () => {
    // Test implementation
  });
});
```

### 2. Mock Responses
```typescript
const mockGeocodeResponse = {
  lat: 40.7128,
  lon: -74.0060,
  display_name: "New York, NY, USA",
  address: {
    city: "New York",
    state: "NY",
    country: "USA"
  }
};
```

This documentation provides a comprehensive guide to the API integration in the Meet Me Halfway application. 