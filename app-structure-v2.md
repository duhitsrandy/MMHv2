# Meet Me Halfway App Structure (v2)

## Overview
Meet Me Halfway is a Next.js application that helps users find a convenient meeting point between two locations. The app features user authentication, subscription management, and comprehensive API security measures alongside its core functionality of calculating routes and finding points of interest.

## Core Components

### 1. Authentication & Authorization
- **Clerk Integration** (`components/auth/auth-provider.tsx`):
  - Handles user authentication and session management
  - Supports dark/light theme integration
  - Manages protected routes and public access
- **Middleware** (`middleware.ts`):
  - Combines Clerk authentication with rate limiting
  - Defines public and protected routes
  - Enforces API security measures

### 2. Theme System
- **Theme Provider** (`components/providers/theme-provider.tsx`):
  - Implements dark/light mode support
  - Integrates with Clerk's appearance settings
  - Provides system theme detection

### 3. Database & Data Models
- **Supabase Integration**:
  - PostgreSQL database with Drizzle ORM
  - Schema definitions in `db/schema/`:
    - `searches-schema.ts`: User search history
    - `pois-schema.ts`: Points of interest data
    - `profiles-schema.ts`: User profiles and subscriptions
    - `locations-schema.ts`: Location data
- **Migrations**: Managed through Drizzle

### 4. API Security & Rate Limiting
- **Rate Limiting** (`lib/rate-limit.ts`):
  - Three-tier system (anonymous, authenticated, special)
  - Upstash Redis implementation (`@upstash/ratelimit`)
  - Configurable limits via environment variables
- **API Protection** (`lib/api-protection.ts`):
  - Provides utilities for securing API endpoints (e.g., checking methods, headers).
- **Security Utilities** (`lib/security.ts`):
  - General security-related helper functions.
- **Input Validation** (`lib/validation.ts`):
  - Zod schemas and functions for validating request inputs.

### 5. Meet Me Halfway Core Feature
- **Main App Wrapper** (`app/meet-me-halfway/_components/meet-me-halfway-app.tsx`):
  - Likely orchestrates the overall feature state and components.
- **Main App Page** (`app/meet-me-halfway/page.tsx`):
  - Entry point for the `/meet-me-halfway` route.
  - Renders the main application component (`MeetMeHalfwayApp`).
- **Search Form** (`app/meet-me-halfway/_components/meet-me-halfway-form.tsx`):
  - Handles address inputs, geocoding requests (via actions), and form state.
- **Results Map Wrapper** (`app/meet-me-halfway/_components/results-map.tsx`):
  - Manages the display logic for the map and POI data.
  - Handles loading states and coordinates data flow between map and POIs.
- **Map Component** (`app/meet-me-halfway/_components/map-component.tsx`):
  - Renders the interactive Leaflet map.
  - Visualizes routes, midpoints, and POI markers.
- **Points of Interest List** (`app/meet-me-halfway/_components/points-of-interest.tsx`):
  - Displays the list of found POIs.
  - Shows travel time information.
  - Handles POI selection and interaction with the map.
- **Supporting Components**:
  - `saved-locations.tsx`: Component for handling saved user locations.
  - `recent-searches.tsx`: Component for displaying recent searches.
  - `results-skeleton.tsx`, `meet-me-halfway-skeleton.tsx`: Loading state placeholders.
  - `leaflet.css`: Custom styles for the Leaflet map.

### 6. Payment & Subscription
- **Stripe Integration**:
  - Server Actions (`actions/stripe-actions.ts`) likely handle creating checkout sessions, managing subscriptions.
  - API Routes (`app/api/stripe/`) likely handle Stripe webhooks for events like successful payments or subscription updates.
  - Utility functions might exist in `lib/stripe.ts`.
- **Membership Levels**:
  - Free and Pro tiers
  - Feature access control
  - Subscription status tracking

## API Integration

### 1. Authentication APIs
- **Clerk API**:
  - User authentication
  - Session management
  - Profile data

### 2. Location Services
- **LocationIQ**:
  - Geocoding (`locationiq-actions.ts` -> `geocodeLocationAction`)
  - POI Search (`locationiq-actions.ts` -> `searchPoisAction`)
- **OSRM** (*Note: Specific OSRM actions/routes not listed, may be integrated within ORS/LocationIQ actions or replaced*):
  - Potentially used for route calculations.
- **OpenRouteService (ORS)**:
  - Travel time matrix (`ors-actions.ts` -> `getTravelTimeMatrixAction`)
  - Route calculation (`ors-actions.ts` -> `getRouteAction` - *potentially replacing OSRM*)

### 3. Payment APIs
- **Stripe**:
  - Checkout sessions, subscription management (via `actions/stripe-actions.ts`).
  - Webhook handling (via `app/api/stripe/`).

## State Management

### 1. Authentication State
- User session
- Profile data
- Membership status

### 2. Theme State
- Current theme
- System preference
- Theme persistence

### 3. Core Feature State
- Search inputs
- Route data
- POI data
- Loading states
- Selected POI

### 4. Database State
- Search history
- Saved locations
- User preferences

## Security Measures

### 1. Authentication
- Protected routes
- Session management
- Role-based access

### 2. API Protection
- Rate limiting
- Request validation
- Error handling
- Security headers

### 3. Data Security
- Environment variables
- API key protection
- Database access control

## Directory Structure
*Note: This is a simplified representation. Some directories may contain more files/subdirectories.*
```
├── actions/                  # Server Actions
│   ├── locationiq-actions.ts # LocationIQ API calls (Geocoding, POI Search)
│   ├── ors-actions.ts       # ORS API calls (Routing, Travel Matrix)
│   ├── stripe-actions.ts    # Stripe actions (Checkout, Subscriptions)
│   ├── db/                  # Database interaction actions
│   └── ...                  # Other specific or test actions
├── app/
│   ├── (auth)/             # Authentication routes (Clerk managed)
│   │   ├── login/
│   │   └── signup/
│   ├── api/                # API routes (e.g., for webhooks, specific endpoints)
│   │   ├── ors/           # ORS related endpoints (if any)
│   │   ├── stripe/        # Stripe webhook handler
│   │   ├── route/         # Potential routing related endpoints
│   │   └── ...            # Other API routes (e.g., testing)
│   ├── (main)/             # Main application pages/layouts
│   │   ├── meet-me-halfway/# Core feature route
│   │   │   ├── _components/ # Feature-specific UI Components
│   │   │   │   ├── meet-me-halfway-app.tsx
│   │   │   │   ├── meet-me-halfway-form.tsx
│   │   │   │   ├── results-map.tsx
│   │   │   │   ├── map-component.tsx
│   │   │   │   ├── points-of-interest.tsx
│   │   │   │   └── ... (skeletons, css, etc.)
│   │   │   └── page.tsx     # Feature entry point
│   │   └── ...              # Other main pages (e.g., dashboard, settings)
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles & CSS variables
├── components/
│   ├── auth/               # Authentication UI components (e.g., user button)
│   ├── providers/          # Context providers (Theme, Auth, Query, etc.)
│   ├── ui/                 # Shared UI components (shadcn/ui based)
│   └── ...                 # Other shared components
├── db/
│   ├── migrations/         # Drizzle database migration files
│   └── schema/             # Drizzle schema definitions (*-schema.ts)
├── lib/                    # Shared libraries, utilities, hooks
│   ├── rate-limit.ts       # Rate limiting logic
│   ├── validation.ts       # Zod validation schemas/functions
│   ├── security.ts         # Security helper functions
│   ├── api-protection.ts   # API endpoint security helpers
│   ├── schemas.ts          # Shared Zod schemas (distinct from validation?)
│   ├── utils.ts            # General utility functions (e.g., cn)
│   ├── hooks/              # Custom React hooks
│   ├── clerk.ts            # Clerk related utilities (if any)
│   └── stripe.ts           # Stripe related utilities
├── public/                 # Static assets (images, fonts, etc.)
├── types/                  # Global TypeScript type definitions
├── .env.local              # Local environment variables (DO NOT COMMIT)
├── middleware.ts           # Next.js middleware (Auth, Rate Limiting)
├── next.config.mjs         # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies & scripts
```

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=...
NEXT_PUBLIC_CLERK_SIGN_UP_URL=...

# Location Services
NEXT_PUBLIC_LOCATIONIQ_KEY=...
OPENROUTESERVICE_API_KEY=...

# Payment
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Rate Limiting
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
RATE_LIMIT_REQUESTS=...
RATE_LIMIT_WINDOW=...
```

## Deployment Considerations

### 1. Environment Setup
- Required environment variables
- API key configuration
- Database connection

### 2. Security Configuration
- Rate limiting settings
- API protection
- Authentication setup

### 3. Performance Optimization
- Caching strategies
- API rate limits
- Database indexing

## Development Guidelines

### 1. Code Organization
- Component structure
- State management
- API integration

### 2. Testing
- Unit tests
- Integration tests
- E2E tests

### 3. Documentation
- Code comments
- API documentation
- Deployment guides

This documentation provides a comprehensive overview of the Meet Me Halfway application structure, including all major components, security measures, and development considerations. 