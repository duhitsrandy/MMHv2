# Meet Me Halfway v2

**Full documentation index:** [docs/README.md](docs/README.md)

Expo mobile (`MeetMeHalfwayMobile/`) plus a Next.js web app and API, with tiered geo: LocationIQ, RapidAPI OSRM, OpenRouteService, and HERE (Pro/Business traffic).

A modern application that helps users find the perfect meeting point between locations, with support for alternate routes, points of interest, and travel time calculations.

## Recent Updates

- **Fixed Upgrade Modal**: Resolved issue with upgrade links not working by adding proper environment variables for Stripe price IDs
- **Enhanced GPS Integration**: Improved POI linking to Google Maps, Apple Maps, and Waze with better location recognition
- **Subscription System**: Full Stripe integration with tier-based feature access (Starter, Plus, Pro, Business)

## Features

### Core Functionality
- **Geocoding**: Convert addresses to coordinates using LocationIQ
- **Routing**: Calculate main and alternate routes using OSRM (Fast Routing OSRM via RapidAPI) for map visualization
- **POI Search**: Find points of interest around route midpoints
- **Travel Time Matrix**: OpenRouteService (Starter/Plus and fallback) and HERE API (Pro/Business, including real-time traffic)
- **Interactive Map**: Display routes and POIs on a Leaflet map (web)

### Enhanced Features
- **Dark Mode**: System-aware theme switching with smooth transitions
- **Authentication**: Secure user management with Clerk
- **Rate Limiting**: API protection using Upstash Redis
- **Database Integration**: User profiles and search history with Supabase
- **Responsive Design**: Mobile-friendly web UI with Tailwind CSS
- **Analytics & Monitoring**: PostHog and Sentry (web); see [docs/MONITORING.md](docs/MONITORING.md)

## Tech Stack

### Web
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Maps**: react-leaflet

### Mobile
- **Expo** managed workflow in `MeetMeHalfwayMobile/` — see [docs/mobile-ios-runbook.md](docs/mobile-ios-runbook.md)

### Backend
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle
- **Rate Limiting**: Upstash Redis
- **Geo APIs**: LocationIQ, RapidAPI OSRM, OpenRouteService, HERE API
- **Analytics**: PostHog; **Errors (web)**: Sentry — [docs/SENTRY_VERCEL.md](docs/SENTRY_VERCEL.md)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase, Clerk, Upstash Redis accounts
- API keys for LocationIQ, RapidAPI OSRM, OpenRouteService, and HERE API
- PostHog account (analytics)

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

3. Set up environment variables (see `.env.example`).

4. Set up the database schema:
```bash
npm run db:migrate
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

For **iOS (Expo)**, start the web API first, then follow [docs/mobile-ios-runbook.md](docs/mobile-ios-runbook.md).

## Project Structure

```
├── MeetMeHalfwayMobile/      # Expo iOS app
├── actions/                  # Server Actions
├── app/                      # Next.js App Router
│   └── meet-me-halfway/
├── components/
├── db/
├── docs/                     # Documentation index: docs/README.md
├── lib/
└── middleware.ts
```

## Documentation (canonical)

See [docs/README.md](docs/README.md) for the full index. Start here:

- [App structure](docs/app-structure.md)
- [API integration](docs/api-docs.md)
- [Mobile iOS runbook](docs/mobile-ios-runbook.md)
- [Production checklist](docs/PRODUCTION.md)
- [Monitoring](docs/MONITORING.md)
- [Sentry + Vercel](docs/SENTRY_VERCEL.md)
- [Subscription & billing](docs/SUBSCRIPTION_BILLING.md)

Clerk webhooks and auth details: [docs/auth-docs.md](docs/auth-docs.md).

## Analytics & Monitoring

- **Backend:** PostHog via `trackApiEvent` in `app/lib/monitoring.ts`
- **Frontend:** PostHog page and interaction events
- **Errors (web):** Sentry — [docs/SENTRY_VERCEL.md](docs/SENTRY_VERCEL.md), [docs/MONITORING.md](docs/MONITORING.md)

## Testing

- **API / DB:** See [docs/api-docs.md](docs/api-docs.md) and [docs/db-schema-docs.md](docs/db-schema-docs.md)
- **Mobile QA:** [docs/mobile-qa-checklist.md](docs/mobile-qa-checklist.md)

## Troubleshooting

- Missing environment variables: `.env.example`
- Clerk: [docs/auth-docs.md](docs/auth-docs.md)
- Rate limits: [docs/rate-limit-docs.md](docs/rate-limit-docs.md)
- All docs: [docs/README.md](docs/README.md)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push and open a Pull Request

## License

MIT — see [LICENSE](LICENSE).

## Acknowledgments

- [LocationIQ](https://locationiq.com/) — geocoding and POI
- [Fast Routing OSRM (RapidAPI)](https://rapidapi.com/osrm/api/fast-routing) — routing
- [OpenRouteService](https://openrouteservice.org/) and [HERE](https://www.here.com/) — travel time matrices
- [Clerk](https://clerk.com/), [Supabase](https://supabase.com/), [Upstash](https://upstash.com/)
- [Next.js](https://nextjs.org/), [Expo](https://expo.dev/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Leaflet](https://leafletjs.com/)

---

_Last updated: May 24, 2026_
