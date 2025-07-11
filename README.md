# Meet Me Halfway v2

> **Documentation for this project is now organized in the `docs/` directory.**
> See [docs/README.md](docs/README.md) for a full table of contents.

A modern web application that helps users find the perfect meeting point between two locations, with support for alternate routes, points of interest, and travel time calculations.

## Recent Updates

- **Fixed Upgrade Modal**: Resolved issue with upgrade links not working by adding proper environment variables for Stripe price IDs
- **Enhanced GPS Integration**: Improved POI linking to Google Maps, Apple Maps, and Waze with better location recognition
- **Subscription System**: Full Stripe integration with tier-based feature access (Starter, Plus, Pro, Business)

## Features

### Core Functionality
- **Geocoding**: Convert addresses to coordinates using LocationIQ
- **Routing**: Calculate main and alternate routes using OSRM (e.g., via Fast Routing OSRM RapidAPI or a self-hosted instance) for map visualization.
- **POI Search**: Find points of interest around route midpoints
- **Travel Time Matrix**: Calculate travel times to POIs using OpenRouteService (for free tier users) and HERE API (for pro tier users, including real-time traffic).
- **Interactive Map**: Display routes and POIs on a Leaflet map

### Enhanced Features
- **Dark Mode**: System-aware theme switching with smooth transitions
- **Authentication**: Secure user management with Clerk
- **Rate Limiting**: API protection using Upstash Redis
- **Database Integration**: User profiles and search history with Supabase
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Analytics & Monitoring**: Backend and frontend event tracking with PostHog

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Maps**: react-leaflet
- **State Management**: React Context, Server Actions

### Backend
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle
- **Rate Limiting**: Upstash Redis
- **External APIs**: LocationIQ, OSRM (for route visualization), OpenRouteService (for free tier matrix), HERE API (for pro tier matrix with traffic)
- **Analytics/Monitoring**: PostHog (server and client), file logging (dev only)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Clerk account
- Upstash Redis account
- API keys for LocationIQ, OSRM (if using a hosted service like RapidAPI), OpenRouteService, and HERE API
- PostHog account (for analytics)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mmhv2.git
cd mmhv2
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
See `.env.example` for all required variables and descriptions. Example:
```env
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Database
DATABASE_URL=your_supabase_database_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Rate Limiting
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# API Keys
NEXT_PUBLIC_LOCATIONIQ_KEY=your_locationiq_key
RAPIDAPI_FAST_ROUTING_HOST=fast-routing.p.rapidapi.com
RAPIDAPI_FAST_ROUTING_KEY=your_rapidapi_key
OPENROUTESERVICE_API_KEY=your_ors_key
HERE_API_KEY=your_here_api_key

# Analytics
POSTHOG_API_KEY=your_posthog_key
POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Rate Limiting Configuration
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW=60
RATE_LIMIT_REQUESTS_AUTH=50
RATE_LIMIT_WINDOW_AUTH=60
RATE_LIMIT_REQUESTS_SPECIAL=100
RATE_LIMIT_WINDOW_SPECIAL=60
```

4. Set up the database schema:
```bash
npm run db:migrate
# or npx drizzle-kit migrate
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── actions/                  # Server Actions
├── app/                      # Next.js App Router pages & layouts
│   └── meet-me-halfway/      # Example route
│       ├── _components/      # Route-specific components
│       └── page.tsx
├── components/
│   ├── providers/            # Context Providers (Theme, etc.)
│   └── ui/                   # Reusable UI (shadcn/ui)
├── db/
│   ├── migrations/           # Drizzle migration files
│   └── schema/               # Drizzle schema definitions
├── hooks/                    # Custom React Hooks
├── lib/                      # Utilities (rate-limit, utils)
├── logs/                     # Log files (if used)
├── public/                   # Static assets
├── types/                    # TypeScript types
├── .env.local                # Local environment variables
├── middleware.ts             # Auth & Rate Limiting Middleware
├── drizzle.config.ts         # Drizzle configuration
├── next.config.mjs           # Next.js configuration
├── package.json
└── README.md
```

## Documentation

- [App Structure](docs/app-structure.md)
- [Authentication](docs/auth-docs.md)
- [Rate Limiting](docs/rate-limit-docs.md)
- [Theme System](docs/theme-docs.md)
- [Database Schema](docs/db-schema-docs.md)
- [API Integration](docs/api-docs.md)
- [Production Checklist](docs/PRODUCTION.md)
- [Potential Future Features](docs/POTENTIAL_FUTURE_FEATURES.md)
- [Monitoring & Analytics](docs/MONITORING.md)

## Analytics & Monitoring

- **Backend:** Events (API usage, errors, performance) are tracked using PostHog via `trackApiEvent` in `app/lib/monitoring.ts`. File logging is used as a backup in development.
- **Frontend:** User interactions and page views are tracked with PostHog using the public key.
- **How to view events:** Log in to your PostHog dashboard and filter by event name (e.g., `api_event`, `api_error`).
- **How to add new events:** See [MONITORING.md](MONITORING.md) for details.
- **Troubleshooting:** If events are missing, check API keys, network access, and server logs for `[PostHog Debug]` messages.

## Testing

- **Unit/Integration Tests:** (Add details here if you have a test suite. Example:)
  - Run all tests: `npm test`
  - Add new tests in the `__tests__/` directory or alongside components/actions.
- **Database Tests:** See [db-schema-docs.md](db-schema-docs.md) for migration and seeding instructions.
- **API Tests:** See [api-docs.md](api-docs.md) for API testing examples.

## Troubleshooting

- **Common Issues:**
  - Missing environment variables: Check `.env.example` and ensure all required keys are set.
  - Database connection errors: Verify Supabase credentials and network access.
  - Clerk authentication issues: Check Clerk dashboard and environment variables.
  - Rate limit errors: See [rate-limit-docs.md](rate-limit-docs.md) and Upstash dashboard.
  - Analytics not working: Check PostHog keys, network, and server logs.
- **Where to get help:**
  - Review the relevant documentation files above.
  - Check server logs for error messages.
  - Search the [issues](https://github.com/yourusername/mmhv2/issues) or open a new one.

## Rebuilding from Scratch Checklist

1. Clone the repository and install dependencies
2. Set up all environment variables as described in `.env.example`
3. Set up the database schema and run migrations
4. Configure Clerk, Supabase, Upstash, LocationIQ, Fast Routing OSRM (RapidAPI), and PostHog accounts
5. Run the development server and verify all features (auth, API, analytics, etc.)
6. Review and update documentation as needed
7. (Optional) Run tests to verify setup

## Features in Detail

### 1. Route Calculation
- Main route calculation using Fast Routing OSRM (RapidAPI)
- Alternate route selection based on geographic diversity
- Route visualization with distance and duration

### 2. Points of Interest
- POI search around route midpoints
- Travel time calculation to POIs
- Interactive POI selection and display

### 3. User Experience
- Dark/light mode support
- Responsive design
- Loading states and animations
- Error handling and user feedback

### 4. Security
- Authentication with Clerk
- Rate limiting for API protection
- Secure database access
- Environment variable management

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [LocationIQ](https://locationiq.com/) for geocoding and POI data
- [Fast Routing OSRM (RapidAPI)](https://rapidapi.com/osrm/api/fast-routing) for routing
- [OpenRouteService](https://openrouteservice.org/) (for free tier travel time calculations), HERE API (for pro tier traffic-aware travel time calculations)
- [Clerk](https://clerk.com/) for authentication
- [Supabase](https://supabase.com/) for database
- [Upstash](https://upstash.com/) for Redis
- [Next.js](https://nextjs.org/) for the framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [shadcn/ui](https://ui.shadcn.com/) for components
- [Leaflet](https://leafletjs.com/) for maps

# Meet Me Halfway Map Logic (Updated)

## Marker and Popup Rendering

- **POI markers** are rendered by a dedicated `PoiMarkersLayer` component, which uses the `useMap` hook from `react-leaflet` to reliably add, update, and remove POI markers on the map.
- **Origin markers** now use the default Leaflet marker icon. If you want a custom icon, ensure the correct assets are present in `public/leaflet/` and update the icon reference in `map-component.tsx`.

## Component Responsibilities

### `PoiMarkersLayer`
- Renders POI markers on the map.
- Handles marker creation, icon updates, and removal.
- Binds popups and click/keyboard events to markers.
- Calls the parent `handleMarkerInteraction` when a marker is clicked.

### `MapComponent`
- Manages map state, origin/midpoint markers, and routes.
- Handles POI selection and ensures the map flies to and opens a popup for the selected POI, whether selected via map or card.
- Contains a `useEffect` that listens for changes to `selectedPoiId` and, when it changes, flies the map to the POI and opens a popup at that location.

## Interaction Flow

- **Selecting a POI (via card or marker):**
  - Updates `selectedPoiId` in state.
  - Triggers a map fly-to and popup open at the POI's location.
  - If the marker is already in view and zoomed in, the popup opens immediately.

## Notes

- The marker and popup logic is now robust to timing issues and works for both 2-location and 3+ location searches.
- Debug logging has been removed for production readiness.
- If you add custom marker icons, ensure the assets are present and update the icon references in the code.

## Clerk Webhook Setup

We've configured webhooks for Clerk to handle user events (e.g., user.created) via the endpoint at `/api/webhooks/clerk`. Ensure the following:
- Set the webhook URL in the Clerk dashboard to your ngrok URL + `/api/webhooks/clerk` for local testing.
- Add `CLERK_WEBHOOK_SECRET` to your `.env.local` file.
- The handler is located in `app/api/webhooks/clerk/route.ts`.

This setup syncs user data to the database on events.

---

_Last updated: [DATE]_

<!-- Webhook fix: Updated CLERK_WEBHOOK_SECRET - 2025-06-16 -->
# PostHog client-side tracking fixed Wed Jun 18 22:01:03 EDT 2025
