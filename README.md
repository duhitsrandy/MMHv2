# Meet Me Halfway v2

A modern web application that helps users find the perfect meeting point between two locations, with support for alternate routes, points of interest, and travel time calculations.

## Features

### Core Functionality
- **Geocoding**: Convert addresses to coordinates using LocationIQ
- **Routing**: Calculate main and alternate routes using OSRM
- **POI Search**: Find points of interest around route midpoints
- **Travel Time Matrix**: Calculate travel times to POIs using OpenRouteService
- **Interactive Map**: Display routes and POIs on a Leaflet map

### Enhanced Features
- **Dark Mode**: System-aware theme switching with smooth transitions
- **Authentication**: Secure user management with Clerk
- **Rate Limiting**: API protection using Upstash Redis
- **Database Integration**: User profiles and search history with Supabase
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

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
- **External APIs**: LocationIQ, OSRM, OpenRouteService

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Clerk account
- Upstash Redis account
- API keys for LocationIQ and OpenRouteService

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
OPENROUTESERVICE_API_KEY=your_ors_key

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

- [App Structure](app-structure.md)
- [Authentication](auth-docs.md)
- [Rate Limiting](rate-limit-docs.md)
- [Theme System](theme-docs.md)
- [Database Schema](db-schema-docs.md)
- [API Integration](api-docs.md)

## Features in Detail

### 1. Route Calculation
- Main route calculation using OSRM
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
- [OSRM](http://project-osrm.org/) for routing
- [OpenRouteService](https://openrouteservice.org/) for travel time calculations
- [Clerk](https://clerk.com/) for authentication
- [Supabase](https://supabase.com/) for database
- [Upstash](https://upstash.com/) for Redis
- [Next.js](https://nextjs.org/) for the framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [shadcn/ui](https://ui.shadcn.com/) for components
- [Leaflet](https://leafletjs.com/) for maps
