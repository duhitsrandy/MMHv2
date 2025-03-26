# Meet Me Halfway App Structure

## Overview
Meet Me Halfway is a Next.js application that helps users find a convenient meeting point between two locations. The app calculates two routes between the locations and finds points of interest (POIs) around the midpoints of both routes.

## Core Components

### 1. Main App Component (`app/meet-me-halfway/page.tsx`)
- Entry point for the application
- Handles the main layout and routing
- Manages the overall application state
- Renders the main search interface and results view

### 2. Search Interface (`app/meet-me-halfway/_components/search-interface.tsx`)
- Provides the main search form for two locations
- Features:
  - Address input fields with autocomplete
  - Geocoding using LocationIQ API
  - Form validation and error handling
  - Loading states and user feedback
  - Responsive design for mobile and desktop

### 3. Results Map (`app/meet-me-halfway/_components/results-map.tsx`)
- Displays the calculated routes and meeting points
- Features:
  - Interactive map using react-leaflet
  - Display of both main and alternate routes
  - Markers for start points, end points, and midpoints
  - Points of Interest (POIs) display around both midpoints
  - Route information cards showing duration and distance
  - Responsive layout with collapsible POI panel

### 4. Map Component (`app/meet-me-halfway/_components/map-component.tsx`)
- Handles the map rendering and interaction
- Features:
  - Dynamic map bounds adjustment
  - Route polyline rendering
  - Custom markers for locations
  - POI markers with popups
  - Map controls and zoom functionality

### 5. Points of Interest (`app/meet-me-halfway/_components/points-of-interest.tsx`)
- Displays and manages POIs around both midpoints
- Features:
  - List of POIs with categories
  - Distance and rating information
  - Filtering by POI type
  - Interactive POI selection
  - Responsive design for mobile and desktop

## API Integration

### 1. LocationIQ API (`actions/locationiq-actions.ts`)
- Handles all LocationIQ API interactions
- Key functions:
  - `geocodeAddress`: Converts addresses to coordinates
  - `getRouteAction`: Calculates the main route
  - `getAlternateRouteAction`: Calculates an alternative route
  - `searchPoisAction`: Finds POIs around a location
  - `reverseGeocodeAction`: Converts coordinates to addresses

### 2. Overpass API Integration
- Used for POI search through LocationIQ
- Queries for various POI types:
  - Amenities (restaurants, cafes, etc.)
  - Leisure facilities
  - Tourist attractions
  - Shopping locations
- Implements deduplication and distance-based sorting

## State Management

### 1. Route State
- Manages both main and alternate routes
- Stores:
  - Route geometry
  - Duration and distance
  - Midpoint coordinates
  - Route metadata

### 2. POI State
- Manages POIs for both midpoints
- Features:
  - Deduplication based on OSM ID
  - Distance-based sorting
  - Category-based filtering
  - Combined display of POIs from both midpoints

## Key Features

### 1. Route Calculation
- Calculates two routes between locations
- Main route: Direct route between points
- Alternate route: Different path with similar duration
- Both routes are displayed simultaneously

### 2. Midpoint Calculation
- Calculates midpoints along both routes
- Considers actual route geometry
- Provides meeting points at equal travel time

### 3. POI Discovery
- Finds POIs around both midpoints
- Implements radius-based search
- Categorizes POIs by type
- Sorts by distance from midpoint
- Limits to 8 POIs per route for clarity

### 4. User Interface
- Responsive design for all screen sizes
- Interactive map with route visualization
- Collapsible POI panel
- Loading states and error handling
- Clear feedback for user actions

## Recent Changes

### 1. Route Display Updates
- Removed route selection/toggle functionality
- Both routes now displayed simultaneously
- Improved route visualization
- Example implementation:
```typescript
// In results-map.tsx
const ResultsMap: React.FC<ResultsMapProps> = ({
  startLat,
  startLng,
  endLat,
  endLng,
  startAddress,
  endAddress
}) => {
  // Both routes are now always displayed
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,350px] gap-4">
      <MapComponent
        startLat={startLat}
        startLng={startLng}
        endLat={endLat}
        endLng={endLng}
        startAddress={startAddress}
        endAddress={endAddress}
        mainRoute={mainRoute}
        alternateRoute={alternateRoute}
        showAlternateRoute={true}
        pois={currentPois}
        showPois={true}
      />
      <PointsOfInterest
        pois={currentPois}
        onPoiSelect={handlePoiSelect}
      />
    </div>
  );
};
```

### 2. POI Handling Improvements
- POIs now fetched for both midpoints
- Implemented deduplication based on OSM ID
- Combined display of POIs from both routes
- Limited to 8 POIs per route for clarity
- Example implementation:
```typescript
// In locationiq-actions.ts
export async function searchPoisAction(
  lat: string,
  lon: string,
  radius: number = 1000,
  types: string[] = ["amenity", "leisure", "tourism", "shop"]
): Promise<ActionState<PoiResponse[]>> {
  console.log(`[POI Search] Starting search at ${lat},${lon} with radius ${radius}m`);
  
  try {
    // ... existing query construction ...
    
    const pois = data.elements
      .filter((poi: OverpassElement) => {
        const lat = poi.lat || poi.center?.lat;
        const lon = poi.lon || poi.center?.lon;
        return lat && lon;
      })
      .map((poi: OverpassElement) => ({
        id: poi.id.toString(),
        osm_id: poi.id.toString(),
        name: poi.tags?.name || poi.tags?.['addr:housename'] || 'Unnamed Location',
        type: poi.tags?.amenity || poi.tags?.leisure || poi.tags?.tourism || poi.tags?.shop || 'place',
        lat: (poi.lat || poi.center?.lat).toString(),
        lon: (poi.lon || poi.center?.lon).toString(),
        tags: poi.tags || {}
      }))
      .slice(0, 8); // Limited to 8 POIs per route

    return {
      isSuccess: true,
      data: pois
    };
  } catch (error) {
    // ... error handling ...
  }
}
```

### 3. UI Improvements
- Enhanced responsive design
- Improved POI card layout
- Better error handling and loading states
- Example implementation:
```typescript
// In points-of-interest.tsx
const PointsOfInterest: React.FC<PointsOfInterestProps> = ({
  pois,
  onPoiSelect
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Points of Interest</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
        </div>
      </div>
      
      {showFilters && (
        <div className="space-y-2">
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        {filteredPois.map(poi => (
          <Card
            key={poi.osm_id}
            className="cursor-pointer hover:bg-accent"
            onClick={() => onPoiSelect(poi)}
          >
            <CardHeader>
              <CardTitle>{poi.name}</CardTitle>
              <CardDescription>{poi.type}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {formatDistance(poi.distance)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
```

## Future Improvements
1. Add more POI categories
2. Implement POI filtering by distance
3. Add route comparison features
4. Enhance mobile responsiveness
5. Add more detailed POI information

## Tech Stack Breakdown

### Frontend
- **Next.js 14+**: App Router, Server Components
- **React**: For UI components and state management
- **Tailwind CSS**: For styling
- **Shadcn UI**: Component library built on Radix UI
- **Framer Motion**: For animations
- **Leaflet**: For interactive maps

### Backend
- **Supabase**: PostgreSQL database
- **Drizzle ORM**: Type-safe database operations
- **Server Actions**: Next.js server-side operations
- **LocationIQ API**: Geocoding, routing, and POI search

### Authentication
- **Clerk**: User authentication and management

### Analytics
- **PostHog**: User behavior tracking

### Development Tools
- **TypeScript**: Type safety
- **ESLint & Prettier**: Code formatting
- **Husky**: Git hooks

## Directory Structure

```
├── actions/
│   ├── db/
│   │   └── searches-actions.ts
│   └── location-actions.ts
├── app/
│   ├── api/
│   ├── meet-me-halfway/
│   │   ├── results/
│   │   └── saved-searches/
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── map/
│   └── search/
├── db/
│   ├── schema/
│   └── db.ts
├── lib/
│   ├── hooks/
│   └── utils.ts
└── types/
```

## Key Implementation Details

### 1. Authentication Flow
- Clerk handles user authentication
- Protected routes using middleware
- User session management

### 2. Database Operations
```typescript
// Example server action for saving a search
export async function saveSearchAction(
  startLocation: string,
  endLocation: string,
  midpoint: Coordinates
): Promise<ActionState<Search>> {
  try {
    const [search] = await db
      .insert(searchesTable)
      .values({
        userId: auth().userId,
        startLocation,
        endLocation,
        midpoint
      })
      .returning();
    
    return {
      isSuccess: true,
      message: "Search saved successfully",
      data: search
    };
  } catch (error) {
    return {
      isSuccess: false,
      message: "Failed to save search"
    };
  }
}
```

### 3. Map Integration
```typescript
// Example map component structure
interface MapProps {
  center: Coordinates;
  markers: Array<{
    position: Coordinates;
    type: 'start' | 'end' | 'poi';
    info?: string;
  }>;
  routes?: Array<{
    points: Coordinates[];
    color: string;
  }>;
}
```

### 4. Points of Interest
```typescript
interface POI {
  id: string;
  name: string;
  type: string;
  coordinates: Coordinates;
  address: string;
  rating?: number;
  distance: number;
}

// Example POI fetch function
async function fetchNearbyPOIs(
  location: Coordinates,
  radius: number
): Promise<POI[]> {
  // LocationIQ API call implementation
}
```

## Environment Variables
```env
# Required environment variables
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_LOCATIONIQ_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=
NEXT_PUBLIC_CLERK_SIGN_UP_URL=
```

## Deployment Considerations

### Database Setup
1. Create Supabase project
2. Run migrations
3. Set up RLS policies

### API Keys
1. LocationIQ API key with required permissions
2. Clerk configuration
3. Supabase connection details

### Performance Optimization
1. Image optimization
2. API route caching
3. Static page generation where possible

## Error Handling

```typescript
// Example error handling structure
interface ErrorResponse {
  code: string;
  message: string;
  details?: unknown;
}

function handleApiError(error: unknown): ErrorResponse {
  if (error instanceof Error) {
    return {
      code: 'INTERNAL_ERROR',
      message: error.message
    };
  }
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred'
  };
}
```

## Testing Considerations

1. Unit tests for utility functions
2. Integration tests for API routes
3. E2E tests for critical user flows

## Security Measures

1. Input validation
2. Rate limiting
3. API key protection
4. SQL injection prevention through Drizzle ORM
5. XSS prevention
6. CORS configuration

This documentation serves as a comprehensive guide for rebuilding the Meet-Me-Halfway application. It includes core functionality, database structure, API integrations, and important implementation details. 

## Additional Implementation Details

### 1. Route Protection
```typescript
// middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/login", "/signup"],
  ignoredRoutes: ["/api/webhooks(.*)"]
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"]
};
```

### 2. API Rate Limiting
```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
});

export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1m"),
  analytics: true
});

// Usage in API routes
export async function rateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await rateLimiter.limit(identifier);
  
  if (!success) {
    throw new Error(`Rate limit exceeded. Try again in ${reset - Date.now()}ms`);
  }
  
  return { remaining, reset };
}
```

### 3. Error Boundaries
```typescript
"use client";

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>;
    }

    return this.props.children;
  }
}
```

### 4. Caching Strategy
```typescript
// lib/cache.ts
export const CACHE_KEYS = {
  RECENT_SEARCHES: (userId: string) => `recent-searches:${userId}`,
  POI_RESULTS: (location: string, radius: number) => 
    `poi:${location}:${radius}`,
  GEOCODING: (address: string) => `geocoding:${address}`
} as const;

export const CACHE_TTL = {
  RECENT_SEARCHES: 60 * 60 * 24, // 24 hours
  POI_RESULTS: 60 * 60, // 1 hour
  GEOCODING: 60 * 60 * 24 * 7 // 1 week
} as const;
```

## Project Setup and Configuration

### Environment Variables
```bash
# Authentication - Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=
NEXT_PUBLIC_CLERK_SIGN_UP_URL=
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=

# LocationIQ API
NEXT_PUBLIC_LOCATIONIQ_KEY=

# Database - Supabase
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Analytics - PostHog
POSTHOG_KEY=
```

### Initial Setup Steps

1. **Database Setup**
```typescript
// db/setup.ts
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });

async function setupDatabase() {
  const db = drizzle(migrationClient);
  await migrate(db, { migrationsFolder: "drizzle" });
}

setupDatabase()
  .catch(console.error)
  .finally(() => migrationClient.end());
```

2. **API Integration Configuration**
```typescript
// lib/api/locationiq.ts
export const LOCATIONIQ_CONFIG = {
  endpoints: {
    geocoding: "https://us1.locationiq.com/v1/search.php",
    reverse: "https://us1.locationiq.com/v1/reverse.php",
    directions: "https://us1.locationiq.com/v1/directions/driving",
    nearby: "https://us1.locationiq.com/v1/nearby.php"
  },
  rateLimits: {
    requestsPerSecond: 2,
    dailyLimit: 5000
  },
  retryConfig: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 5000
  }
};

export class LocationIQError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string
  ) {
    super(message);
    this.name = "LocationIQError";
  }
}

export async function makeLocationIQRequest<T>(
  endpoint: keyof typeof LOCATIONIQ_CONFIG["endpoints"],
  params: Record<string, string>
): Promise<T> {
  const url = new URL(LOCATIONIQ_CONFIG.endpoints[endpoint]);
  url.search = new URLSearchParams({
    ...params,
    key: process.env.NEXT_PUBLIC_LOCATIONIQ_KEY!,
    format: "json"
  }).toString();

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new LocationIQError(
      "LocationIQ API request failed",
      response.status,
      await response.text()
    );
  }

  return response.json();
}
```

## Testing

### Unit Tests

```typescript
// __tests__/midpoint.test.ts
import { calculateMidpoint } from "@/lib/midpoint";
import { mockLocationIQResponse } from "@/lib/test-utils";

jest.mock("@/lib/api/locationiq");

describe("Midpoint Calculation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calculates correct midpoint between two points", async () => {
    const start = { lat: 40.7128, lng: -74.0060 }; // NYC
    const end = { lat: 34.0522, lng: -118.2437 }; // LA
    
    mockLocationIQResponse({
      routes: [{ duration: 3600 }] // 1 hour
    });

    const result = await calculateMidpoint(start, end);
    
    expect(result.midpoint).toEqual({
      lat: expect.closeTo(37.3825, 2),
      lng: expect.closeTo(-96.1248, 2)
    });
    expect(result.travelTimeA).toBe(3600);
    expect(result.travelTimeB).toBe(3600);
  });

  it("handles API errors gracefully", async () => {
    const start = { lat: 40.7128, lng: -74.0060 };
    const end = { lat: 34.0522, lng: -118.2437 };
    
    mockLocationIQResponse(null, new LocationIQError("Rate limit exceeded", 429, "TOO_MANY_REQUESTS"));

    await expect(calculateMidpoint(start, end)).rejects.toThrow("Rate limit exceeded");
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/search-flow.test.ts
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SearchPage } from "@/app/meet-me-halfway/page";

describe("Search Flow", () => {
  it("completes full search process", async () => {
    render(<SearchPage />);

    // Fill in search form
    fireEvent.change(screen.getByLabelText(/start location/i), {
      target: { value: "New York, NY" }
    });
    fireEvent.change(screen.getByLabelText(/end location/i), {
      target: { value: "Boston, MA" }
    });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /find midpoint/i }));

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText(/midpoint found/i)).toBeInTheDocument();
    });

    // Verify map and POIs are displayed
    expect(screen.getByTestId("map-container")).toBeInTheDocument();
    expect(screen.getByTestId("poi-list")).toBeInTheDocument();
  });
});
```

## Performance Optimization

### Caching Strategy

```typescript
// lib/cache.ts
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
});

export const CACHE_KEYS = {
  search: (id: string) => `search:${id}`,
  location: (query: string) => `location:${query}`,
  poi: (location: string, radius: number) => `poi:${location}:${radius}`
};

export const CACHE_TTL = {
  search: 60 * 60 * 24, // 24 hours
  location: 60 * 60 * 24 * 7, // 1 week
  poi: 60 * 60 // 1 hour
};

export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number
): Promise<T> {
  const cached = await redis.get<T>(key);
  if (cached) return cached;

  const fresh = await fetchFn();
  await redis.setex(key, ttl, fresh);
  return fresh;
}

// Example usage
export async function getCachedSearchResults(searchId: string) {
  return getCachedData(
    CACHE_KEYS.search(searchId),
    () => db.query.searches.findFirst({
      where: eq(searches.id, searchId)
    }),
    CACHE_TTL.search
  );
}
```

### API Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
});

export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1m"),
  analytics: true,
  prefix: "mmh-api"
});

export async function withRateLimit(
  identifier: string,
  fn: () => Promise<any>
) {
  const { success, reset } = await rateLimiter.limit(identifier);
  
  if (!success) {
    throw new Error(`Rate limit exceeded. Try again in ${reset - Date.now()}ms`);
  }
  
  return fn();
}
```

## Deployment

### Vercel Configuration

```json
// vercel.json
{
  "env": {
    "NEXT_PUBLIC_LOCATIONIQ_KEY": "@locationiq_key",
    "DATABASE_URL": "@database_url",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": "@clerk_pub_key",
    "CLERK_SECRET_KEY": "@clerk_secret_key"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_LOCATIONIQ_KEY": "@locationiq_key",
      "DATABASE_URL": "@database_url",
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": "@clerk_pub_key",
      "CLERK_SECRET_KEY": "@clerk_secret_key"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Build Optimization

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "locationiq.com",
      "openstreetmap.org"
    ]
  },
  experimental: {
    serverActions: true
  },
  webpack: (config) => {
    config.optimization.minimize = true;
    return config;
  }
};

module.exports = nextConfig;
```

[Previous sections about State Management, Error Handling, etc. remain the same] 