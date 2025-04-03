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
  - Upstash Redis implementation
  - Configurable limits via environment variables
- **API Protection** (`lib/api-protection.ts`):
  - Request validation
  - Security headers
  - Error handling

### 5. Meet Me Halfway Core Feature
- **Main App Component** (`app/meet-me-halfway/page.tsx`):
  - Entry point for the core feature
  - Manages search and results views
- **Search Interface** (`app/meet-me-halfway/_components/search-interface.tsx`):
  - Address input and validation
  - Geocoding via LocationIQ
  - User feedback and loading states
- **Results Map** (`app/meet-me-halfway/_components/results-map.tsx`):
  - Orchestrates map and POI data display
  - Manages loading states and data flow
- **Map Component** (`app/meet-me-halfway/_components/map-component.tsx`):
  - Interactive map rendering
  - Route and POI visualization
  - User interaction handling
- **Points of Interest** (`app/meet-me-halfway/_components/points-of-interest.tsx`):
  - POI list display
  - Selection and interaction
  - Travel time information

### 6. Payment & Subscription
- **Stripe Integration**:
  - Subscription management
  - Payment processing
  - Webhook handling
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
  - Geocoding (`geocodeLocationAction`)
  - POI Search (`searchPoisAction`)
- **OSRM**:
  - Main route calculation (`getRouteAction`)
  - Alternate routes (`getAlternateRouteAction`)
- **OpenRouteService**:
  - Travel time matrix (`getTravelTimeMatrixAction`)

### 3. Payment APIs
- **Stripe**:
  - Subscription management
  - Payment processing
  - Customer portal

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

```
├── actions/                  # Server Actions
│   ├── locationiq-actions.ts # LocationIQ API calls
│   ├── ors-actions.ts       # ORS API calls
│   └── db/                  # Database operations
├── app/
│   ├── (auth)/             # Authentication routes
│   │   ├── login/
│   │   └── signup/
│   ├── api/                # API routes
│   │   ├── ors/           # ORS endpoints
│   │   ├── stripe/        # Payment endpoints
│   │   └── test/          # Testing endpoints
│   └── meet-me-halfway/    # Core feature
│       ├── _components/    # UI Components
│       └── page.tsx        # Feature entry point
├── components/
│   ├── auth/              # Authentication components
│   └── providers/         # Theme and auth providers
├── db/
│   ├── migrations/        # Database migrations
│   └── schema/           # Database schemas
├── lib/
│   ├── rate-limit.ts     # Rate limiting
│   ├── validation.ts     # Input validation
│   └── security.ts       # Security utilities
├── public/               # Static assets
└── types/               # TypeScript types
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