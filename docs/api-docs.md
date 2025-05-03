# API Documentation

## Overview
The Meet Me Halfway application integrates with several external APIs for geocoding, routing, and points of interest services. This documentation covers the API endpoints, request/response formats, authentication, error handling, and integration details.

## API Setup Checklist (From Scratch)
1. Set up all required environment variables (see `.env.example`)
2. Ensure Supabase, Clerk, Upstash, LocationIQ, **Fast Routing OSRM (RapidAPI)**, OpenRouteService, and PostHog accounts are configured
3. Run database migrations
4. Start the development server (`npm run dev`)
5. Test endpoints using curl, Postman, or the provided examples below
6. Review [auth-docs.md](auth-docs.md), [rate-limit-docs.md](rate-limit-docs.md), and [MONITORING.md](MONITORING.md) for security, rate limiting, and analytics details

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

### 5. Travel Time Matrix (`getTravelTimeMatrixAction`)
**Description:** Calculate travel times between multiple points using **OpenRouteService** (ORS Matrix API).
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

## Cross-References
- [Authentication & Authorization](auth-docs.md)
- [Rate Limiting](rate-limit-docs.md)
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

#### Travel Time Matrix (`getTravelTimeMatrixAction`)
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

```env
# API Keys
NEXT_PUBLIC_LOCATIONIQ_KEY=...
OPENROUTESERVICE_API_KEY=...

# Rate Limiting
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW=60
RATE_LIMIT_REQUESTS_AUTH=50
RATE_LIMIT_WINDOW_AUTH=60
RATE_LIMIT_REQUESTS_SPECIAL=100
RATE_LIMIT_WINDOW_SPECIAL=60
```

## Environment Variables (Routing)

Add these to your `.env.local` or deployment environment:
```env
# Fast Routing OSRM (RapidAPI)
RAPIDAPI_FAST_ROUTING_HOST=fast-routing.p.rapidapi.com
RAPIDAPI_FAST_ROUTING_KEY=your_rapidapi_key

# OpenRouteService (for travel time matrix only)
OPENROUTESERVICE_API_KEY=your_ors_key
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