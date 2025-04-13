# API Documentation

## Overview
The Meet Me Halfway application integrates with several external APIs for geocoding, routing, and points of interest services. This documentation covers the API endpoints, request/response formats, and integration details.

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