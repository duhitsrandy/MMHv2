# Meet Me Halfway App Structure

## Overview
Meet Me Halfway is a Next.js application that helps users find a convenient meeting point between two locations. The app calculates two routes (main and alternate) between the locations using Fast Routing OSRM (RapidAPI), finds points of interest (POIs) around the midpoints of both routes using LocationIQ, and enriches POIs with travel times using OpenRouteService (ORS Matrix API). Both routes are displayed simultaneously on an interactive map.

## Core Components

### 1. Main App Component (`app/meet-me-halfway/page.tsx`)
- Entry point for the application.
- Renders `MeetMeHalfwayApp` which contains the search and results logic.

### 2. Meet Me Halfway App (`app/meet-me-halfway/_components/meet-me-halfway-app.tsx`)
- Manages the overall state (search inputs, results visibility).
- Conditionally renders `SearchInterface` or `ResultsMap`.
- Handles the transition between search and results.

### 3. Search Interface (`app/meet-me-halfway/_components/search-interface.tsx`)
- Provides the main search form for two locations.
- Features:
  - Address input fields with **debouncing** to limit API calls during typing.
  - Geocoding via LocationIQ (`geocodeLocationAction`).
  - Form validation (likely using `react-hook-form` and potentially Zod).
  - Loading states and user feedback.
  - Callback (`onFindMidpoint`) to trigger results display.

### 4. Results Map (`app/meet-me-halfway/_components/results-map.tsx`)
- Orchestrates the display of map and POI data after a successful search.
- **Data Fetching**: Uses the `useMapData` custom hook:
    - Fetches main route (Fast Routing OSRM via `getRouteAction`).
    - Fetches alternate route (Fast Routing OSRM via `getAlternateRouteAction`).
    - Calculates midpoints for both routes.
    - Fetches initial POIs around both midpoints (LocationIQ via `searchPoisAction`).
    - Fetches travel time matrix (ORS via `getTravelTimeMatrixAction`) to enrich POIs.
- **State Management**: Manages loading states (`isMapDataLoading`, `isPoiTravelTimeLoading`), POI visibility (`showPois`), and selected POI (`selectedPoiId`).
- **Rendering**: Renders `MapComponent` and `PointsOfInterest`, passing down the necessary data (routes, enriched POIs, state).

### 5. Map Component (`app/meet-me-halfway/_components/map-component.tsx`)
- Handles the Leaflet map rendering and interaction.
- Displays:
    - Main route (blue solid line).
    - Alternate route (purple solid line, if available).
    - Markers for start, end, main midpoint, and alternate midpoint (if available).
    - POI markers (using enriched POI data for popups).
- **Interaction**: 
    - Handles POI marker clicks with a smooth `flyTo` animation.
    - Opens POI popups on single click, relying on Leaflet's `autoPan` for visibility.
    - Prevents repeated zooming on consecutive clicks on the same marker.

### 6. Points of Interest (`app/meet-me-halfway/_components/points-of-interest.tsx`)
- Displays a scrollable list of POIs.
- Uses enriched POI data (`combinedPois`) received from `ResultsMap`.
- Displays POI name, type, address, and detailed travel time/distance information calculated via ORS.
- Handles POI selection, synchronizing with the `selectedPoiId` state in `ResultsMap`.

## API Integration

### 1. Geocoding (`actions/locationiq-actions.ts`)
- **API**: LocationIQ Geocoding API.
- **Action**: `geocodeLocationAction`.
- **Purpose**: Converts user-input addresses into latitude/longitude coordinates.

### 2. Routing (`actions/osrm-actions.ts`)
- **API**: Fast Routing OSRM (RapidAPI).
- **Actions**: 
    - `getRouteAction`: Fetches the main driving route.
    - `getAlternateRouteAction`: Fetches up to 3 alternative routes (with fallback to ORS if needed).
- **Purpose**: Calculates the road network paths between the geocoded start and end points.
- **Note**: The app now uses Fast Routing OSRM (RapidAPI) for robust and scalable routing.

### 3. Alternate Route Selection (`actions/locationiq-actions.ts`)
- **Logic**: Within `getAlternateRouteAction`.
- **Process**:
    1. Fetches up to 3 alternatives from OSRM.
    2. Filters alternatives based on reasonable duration/distance compared to the main route.
    3. Calculates midpoints of the main route and valid alternatives.
    4. Selects the alternative whose midpoint is geographically furthest from the main route's midpoint.
    5. Returns the selected alternate route or null/fallback.

### 4. POI Search (`actions/locationiq-actions.ts`)
- **API**: LocationIQ Nearby API (which likely uses Overpass API data).
- **Action**: `searchPoisAction`.
- **Purpose**: Finds POIs (amenities, shops, leisure, tourism) within a specified radius around the calculated midpoints.

### 5. Travel Time Matrix (`actions/ors-actions.ts`)
- **API**: OpenRouteService (ORS) Matrix API.
- **Action**: `getTravelTimeMatrixAction`.
- **Purpose**: Calculates a matrix of travel times and distances between multiple sources (start/end locations) and destinations (all fetched POIs). This data is used to enrich the POIs displayed in the list and popups. (ORS is now only used for this matrix calculation.)

## State Management (`useMapData` hook in `results-map.tsx`)

- **Route State**: `mainRoute`, `alternateRoute` (containing geometry, duration, distance).
- **Midpoint State**: `currentMidpoint`, `alternateMidpoint` (calculated `{lat, lng}` coordinates).
- **POI State**: 
    - `initialPois`: Raw POIs fetched from LocationIQ for both midpoints, deduplicated.
    - `combinedPois`: Enriched POIs after processing with ORS travel time matrix data.
- **Loading State**: `isMapDataLoading` (for routes/initial POIs), `isPoiTravelTimeLoading` (for ORS matrix calculation).

## Key Features & Flow

1.  **Search**: User enters two addresses in `SearchInterface`.
2.  **Geocoding**: Addresses are geocoded using LocationIQ (`geocodeLocationAction`).
3.  **Trigger Results**: `onFindMidpoint` is called in `MeetMeHalfwayApp`, switching the view to `ResultsMap`.
4.  **Fetch Routes & POIs (`useMapData`)**: 
    - Main and alternate routes requested from OSRM.
    - Midpoints calculated.
    - Initial POIs fetched from LocationIQ around both midpoints.
    - `isMapDataLoading` set to `false`, `isPoiTravelTimeLoading` set to `true`.
5.  **Render Initial Map**: `MapComponent` renders with routes and midpoints. `PointsOfInterest` renders with a loading state.
6.  **Fetch Travel Times (`useMapData`)**: 
    - ORS Matrix API called with start/end points and all initial POIs.
7.  **Enrich POIs**: Results from ORS are used to add travel time/distance data to each POI, creating `combinedPois`.
8.  **Render Final State**: `isPoiTravelTimeLoading` set to `false`. `MapComponent` updates POI markers (if shown) with popup data. `PointsOfInterest` displays the list with full details.
9.  **Interaction**: User can click POIs on the map (`MapComponent`) or in the list (`PointsOfInterest`), which updates the shared `selectedPoiId` state in `ResultsMap`, highlighting the selection in both components.

## Recent Changes & Refinements

1.  **Map Stability**: Fixed Leaflet rendering errors by simplifying map component lifecycle management and ensuring proper cleanup.
2.  **POI Interaction**: 
    - Clicking a POI marker triggers a smooth `flyTo` animation.
    - Popup opens reliably on a single click.
    - Repeated clicks on an already selected/focused marker do not trigger re-animation.
    - Removed manual map panning after `flyTo`, relying on Leaflet's `autoPan` for better popup visibility.
3.  **API Usage**: Clarified the distinct roles of LocationIQ (Geocoding, POI Search), OSRM (Routing), and ORS (Travel Time Matrix).
4.  **Alternate Route Logic**: Implemented the strategy to select the most geographically distinct alternate route based on midpoint distance.
5.  **Data Flow**: Ensured the fully enriched `combinedPois` data (with travel times) is used for both the POI list display and the map marker popups.

## Future Improvements
1. Add more POI categories & filtering options.
2. Implement user accounts to save searches.
3. Add route comparison features (e.g., elevation, road types).
4. Now uses Fast Routing OSRM (RapidAPI) for robust routing service. Consider additional providers for redundancy if needed.
5. Add unit/integration tests.

## Tech Stack Breakdown (Summary)

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, react-leaflet, react-hook-form, next-themes
- **Backend/APIs**: Next.js Server Actions, LocationIQ, Fast Routing OSRM (RapidAPI), OpenRouteService
- **Database**: Supabase (PostgreSQL) with Drizzle ORM
- **Authentication**: Clerk
- **Rate Limiting**: Upstash Redis with @upstash/ratelimit
- **State Management**: React Context (for Theme, potentially Auth), Server State via Server Actions, Local Component State, `react-hook-form` for forms.

## Directory Structure (Enhanced)

```
├── actions/                  # Server Actions for API calls & DB interactions
│   ├── locationiq-actions.ts # Geocoding, OSRM Routing, POI Search
│   └── ors-actions.ts        # ORS Matrix API calls
├── app/
│   └── (main routes like /meet-me-halfway/, /login, /profile, etc.)
│       └── meet-me-halfway/
│           ├── _components/      # Specific UI Components for this route
│           │   ├── map-component.tsx
│           │   ├── points-of-interest.tsx
│           │   ├── results-map.tsx
│           │   ├── search-interface.tsx
│           │   └── meet-me-halfway-app.tsx
│           └── page.tsx          # Page entry point
├── components/
│   ├── providers/           # Context Providers (Theme, Auth?)
│   └── ui/                  # Reusable UI Components (shadcn/ui based)
├── db/
│   ├── migrations/           # Drizzle migration files
│   └── schema/               # Drizzle schema definitions
│       ├── profiles-schema.ts
│       ├── locations-schema.ts
│       ├── searches-schema.ts
│       └── (other schemas like pois-schema.ts if exist)
├── hooks/                    # Custom React Hooks
├── lib/                      # Utilities
│   ├── rate-limit.ts         # Rate Limiting logic
│   └── utils.ts              # General utility functions
├── logs/                     # Log files (if configured)
├── public/                   # Static assets
├── types/                    # TypeScript types
├── .env.local                # Local environment variables
├── middleware.ts             # Clerk auth and Rate Limiting middleware
├── drizzle.config.ts         # Drizzle configuration
├── next.config.mjs           # Next.js configuration
├── package.json
└── README.md
```

## Key Implementation Snippets

### Map Component - POI Click Handler (Simplified Logic)
```typescript
// Inside MapComponent useEffect for rendering POIs
marker.on('click', () => {
  if (!map) return;

  if (onPoiSelect) {
    onPoiSelect(uniqueKey);
  }

  const targetLatLng = L.latLng(poiLat, poiLon);
  const targetZoom = 15;
  const currentCenter = map.getCenter();
  const currentZoom = map.getZoom();

  // Prevent re-animation if already focused
  if (currentZoom === targetZoom && currentCenter.distanceTo(targetLatLng) < 10) {
    if (!marker.isPopupOpen()) marker.openPopup();
    return;
  }

  // Fly to marker
  map.flyTo(targetLatLng, targetZoom, { duration: 0.8 });

  // Open popup on arrival (Leaflet autoPan handles visibility)
  map.once('moveend', () => {
    const currentMarker = poiMarkers.current.get(uniqueKey);
    if (currentMarker && !currentMarker.isPopupOpen()) {
      currentMarker.openPopup();
    }
  });
});
```

### Results Map - Passing Props
```typescript
// Inside ResultsMap component return
<MapComponent
  // ... other props
  mainRoute={mainRoute}
  alternateRoute={alternateRoute}
  pois={mapComponentPois} // Enriched POIs
  showPois={showPois}
  showAlternateRoute={!!alternateRoute} // Show if exists
  selectedPoiId={selectedPoiId}
  onPoiSelect={setSelectedPoiId}
/>
<PointsOfInterest
  pois={combinedPois} // Enriched POIs
  // ... other props
  onPoiSelect={setSelectedPoiId}
  isLoading={isPoiTravelTimeLoading || isMapDataLoading}
/>
```

### Alternate Route Action - Selection Concept
```typescript
// Conceptual logic within getAlternateRouteAction
async function getAlternateRouteAction(...) {
  // 1. Fetch routes from OSRM (alternatives=3)
  const osrmResponse = await fetchOsrmRoutes(...);
  const mainRoute = osrmResponse.routes[0];
  const potentialAlternates = osrmResponse.routes.slice(1);

  // 2. Filter long alternatives
  const validAlternates = potentialAlternates.filter(alt => 
    alt.distance < mainRoute.distance * 1.4 // Example: max 40% longer
  );

  // 3. Calculate midpoints
  const mainMidpoint = calculateRouteMidpoint(mainRoute);
  const alternateMidpoints = validAlternates.map(calculateRouteMidpoint);

  // 4. Find furthest midpoint
  let bestAlternate = null;
  let maxDistance = -1;

  validAlternates.forEach((alt, index) => {
    const altMidpoint = alternateMidpoints[index];
    if (mainMidpoint && altMidpoint) {
      const distance = calculateGeoDistance(mainMidpoint, altMidpoint);
      if (distance > maxDistance) {
        maxDistance = distance;
        bestAlternate = alt;
      }
    }
  });

  // 5. Return bestAlternate (or null/fallback)
  return { isSuccess: true, data: bestAlternate }; 
}
```

## Environment Variables
```env
# Required environment variables
NEXT_PUBLIC_LOCATIONIQ_KEY=your_locationiq_api_key_here

# Optional for future features (Rate Limiting, DB, Auth)
# UPSTASH_REDIS_URL=
# UPSTASH_REDIS_TOKEN=
# DATABASE_URL=
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
# CLERK_SECRET_KEY=
# NEXT_PUBLIC_CLERK_SIGN_IN_URL=...
# NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=...
```

## Deployment Considerations
- Ensure `NEXT_PUBLIC_LOCATIONIQ_KEY` is set in the deployment environment (e.g., Vercel).
- The app currently relies on free tiers/public endpoints (OSRM Demo, ORS free tier). Consider dedicated/paid services for production use to ensure reliability and higher rate limits.

## Security Measures
- **API Key**: The LocationIQ key is public (`NEXT_PUBLIC_`). While necessary for client-side use in some scenarios, ideally, sensitive API calls (especially if paid) should be proxied through Server Actions or API routes to hide the key.
- **Rate Limiting**: Currently not implemented for OSRM/ORS calls but recommended for production, especially if using paid services.
- **Input Validation**: Basic validation exists, but robust server-side validation in actions is crucial.

## Authentication (Clerk)

- **Integration**: Uses `@clerk/nextjs` for frontend and backend integration.
- **Middleware (`middleware.ts`)**: Protects routes based on authentication status. Public routes are explicitly defined, and all others require login.
- **UI Components**: Leverages Clerk components like `<SignIn />`, `<SignUp />`, `<UserButton />` for login, registration, and user profile management.
- **Hooks**: Uses hooks like `useAuth()` and `useUser()` to access authentication state and user information in client components.
- **Server Actions**: Clerk helpers (`auth()`) are used within Server Actions to get the `userId` and protect actions requiring authentication.

## Database (Supabase & Drizzle)

- **Provider**: Supabase (PostgreSQL) provides the database hosting.
- **ORM**: Drizzle ORM is used for type-safe database access and schema definition.
- **Schema (`db/schema/`)**: Defines the database tables:
    - `profiles-schema.ts`: Stores user profile information, likely linked to Clerk users via `userId`.
    - `locations-schema.ts`: Stores geocoded location data (latitude, longitude, address string).
    - `searches-schema.ts`: Stores historical search records, linking two locations (`locationAId`, `locationBId`) to a user (`userId`) and potentially storing midpoint/route information.
    - `pois-schema.ts`: (Potentially) Stores cached or specific Point of Interest data if needed beyond transient search results.
- **Migrations**: `drizzle-kit` is used to generate and manage SQL migration files (`db/migrations/`) based on schema changes. Migrations are applied using `npm run db:migrate`.
- **Interaction**: Server Actions use Drizzle query builder functions (e.g., `db.select().from(...)`, `db.insert(...)`) to interact with the Supabase database.

## Rate Limiting (Upstash Redis)

- **Provider**: Upstash Redis provides a serverless Redis instance.
- **Library**: `@upstash/ratelimit` is used to implement rate limiting logic.
- **Implementation (`lib/rate-limit.ts`)**: Contains the core rate limiting function, likely configured with different limits (anonymous, authenticated, special) based on environment variables.
- **Usage (`middleware.ts`)**: The rate limiting function is called within the middleware for requests targeting `/api/` routes, using the user's IP address or potentially `userId` (if available and authenticated) as the identifier. It returns appropriate 429 responses if limits are exceeded.

## State Management

- **Route State**: `mainRoute`, `alternateRoute` (containing geometry, duration, distance).
- **Midpoint State**: `currentMidpoint`, `alternateMidpoint` (calculated `{lat, lng}` coordinates).
- **POI State**: 
    - `initialPois`: Raw POIs fetched from LocationIQ for both midpoints, deduplicated.
    - `combinedPois`: Enriched POIs after processing with ORS travel time matrix data.
- **Loading State**: `isMapDataLoading` (for routes/initial POIs), `isPoiTravelTimeLoading` (for ORS matrix calculation).

This documentation serves as a comprehensive guide reflecting the current state of the Meet-Me-Halfway application. 