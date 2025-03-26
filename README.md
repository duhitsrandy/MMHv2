# Meet Me Halfway

A Next.js application that helps users find convenient meeting points between two locations, with points of interest around both the main and alternate routes.

## Features

- **Dual Route Calculation**: Calculates both a main route and an alternate route between two locations
- **Smart Midpoint Finding**: Determines optimal meeting points along both routes
- **Points of Interest**: Shows relevant POIs around both midpoints
- **Interactive Map**: Visualizes routes and locations using react-leaflet
- **Responsive Design**: Works well on both desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Maps**: react-leaflet with OpenStreetMap
- **APIs**: 
  - LocationIQ for geocoding and routing
  - Overpass API for POI data
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn
- LocationIQ API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/meet-me-halfway.git
cd meet-me-halfway
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your LocationIQ API key:
```env
LOCATIONIQ_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
meet-me-halfway/
├── app/
│   └── meet-me-halfway/
│       ├── _components/
│       │   ├── map-component.tsx
│       │   ├── points-of-interest.tsx
│       │   ├── results-map.tsx
│       │   └── search-interface.tsx
│       └── page.tsx
├── actions/
│   └── locationiq-actions.ts
├── types/
│   └── poi-types.ts
└── public/
    └── markers/
```

## Key Components

### Search Interface
- Handles location input and validation
- Provides address autocomplete
- Manages form state and submission
- Integrates with geocoding service

### Results Map
- Displays both routes simultaneously
- Shows start points, end points, and midpoints
- Integrates POI display
- Provides route information cards
- Responsive layout with collapsible POI panel

### Points of Interest
- Shows POIs around both midpoints
- Implements filtering and sorting
- Displays distance and category information
- Handles POI selection and interaction
- Category-based filtering system

## API Integration

### LocationIQ API
- Geocoding: Converts addresses to coordinates
- Routing: Calculates main and alternate routes
- POI Search: Finds points of interest around locations

### Overpass API
- Provides detailed POI data
- Supports various POI categories
- Implements efficient querying and filtering

## Recent Updates

1. **Route Display**
   - Removed route selection/toggle functionality
   - Both routes now displayed simultaneously
   - Improved route visualization

2. **POI Handling**
   - POIs now fetched for both midpoints
   - Implemented deduplication based on OSM ID
   - Combined display of POIs from both routes
   - Limited to 8 POIs per route for clarity

3. **UI Improvements**
   - Enhanced responsive design
   - Improved POI card layout
   - Better error handling and loading states

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [LocationIQ](https://locationiq.com/) for geocoding and routing services
- [OpenStreetMap](https://www.openstreetmap.org/) for map data
- [react-leaflet](https://react-leaflet.js.org/) for map components
