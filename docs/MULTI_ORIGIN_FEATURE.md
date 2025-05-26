# Multi-Origin Feature Documentation

## Overview
The Multi-Origin feature allows users to find meeting points between more than two locations (3+ locations). This advanced feature calculates a central meeting point that minimizes total travel time for all participants, making it ideal for group meetings and events.

## Feature Capabilities

### Supported Scenarios
- **2 Locations**: Traditional midpoint calculation with main and alternate routes
- **3+ Locations**: Central meeting point calculation with geometric centroid
- **Maximum Locations**: Varies by subscription tier (see tier limits below)

### Tier-Based Limits
- **Starter (Free)**: 2 locations maximum
- **Plus**: 3 locations maximum  
- **Pro**: 5 locations maximum
- **Business**: 10 locations maximum

## Implementation Architecture

### Core Components

#### 1. Form Component
**File**: `app/meet-me-halfway/_components/meet-me-halfway-form.tsx`

**Key Features**:
- Dynamic location input fields
- Add/remove location functionality
- Tier-based validation
- Upgrade modal integration

#### 2. Results Map Component  
**File**: `app/meet-me-halfway/_components/results-map.tsx`

**Key Features**:
- Dual-mode rendering (2-location vs 3+ location)
- Centroid calculation for 3+ locations
- POI search around central meeting point
- Traffic-aware travel time calculations

#### 3. Map Component
**File**: `app/meet-me-halfway/_components/map-component.tsx`

**Key Features**:
- Multiple origin markers
- Central meeting point visualization
- POI markers with travel time data
- Responsive map bounds adjustment

## User Experience Flow

### 1. Location Input
```typescript
// User adds locations through the form
const [locations, setLocations] = useState<LocationInput[]>([
  { address: '', coordinates: null },
  { address: '', coordinates: null }
]);

// Add new location (with tier validation)
const addLocation = () => {
  if (locations.length >= maxLocationsForTier) {
    onOpenUpgradeModal?.();
    return;
  }
  setLocations([...locations, { address: '', coordinates: null }]);
};
```

### 2. Geocoding & Validation
```typescript
// Each location is geocoded individually
const geocodedOrigins = await Promise.all(
  validLocations.map(async (location) => {
    const result = await geocodeLocationAction(location.address);
    return result.data;
  })
);
```

### 3. Meeting Point Calculation

#### For 2 Locations
- Calculate main route using OSRM/ORS
- Calculate alternate route if available
- Find midpoints of both routes
- Search for POIs around both midpoints

#### For 3+ Locations
- Calculate geometric centroid of all locations
- Search for POIs around the central point
- Calculate travel times from all origins to each POI

### 4. Results Display
- Map shows all origin locations
- Central meeting point highlighted
- POIs displayed with travel time information from all origins
- List view shows comprehensive travel data

## Technical Implementation

### Centroid Calculation
```typescript
const calculateCentroid = (origins: GeocodedOrigin[]): { lat: number; lng: number } => {
  const totalLat = origins.reduce((sum, origin) => sum + parseFloat(origin.lat), 0);
  const totalLng = origins.reduce((sum, origin) => sum + parseFloat(origin.lng), 0);
  
  return {
    lat: totalLat / origins.length,
    lng: totalLng / origins.length
  };
};
```

### POI Search Strategy
```typescript
// For 3+ origins, search around the centroid
if (geocodedOrigins.length > 2) {
  const centroid = calculateCentroid(geocodedOrigins);
  setCentralMidpoint(centroid);
  
  const poisResult = await searchPoisAction({
    lat: centroid.lat.toString(),
    lon: centroid.lng.toString(),
    radius: 2000 // 2km radius
  });
}
```

### Travel Time Matrix
```typescript
// Calculate travel times from ALL origins to each POI
const matrixSourceCoords = geocodedOrigins.map(o => ({ lat: o.lat, lng: o.lng }));

if (plan === 'pro') {
  // Use HERE API for Pro users
  const hereMatrixResult = await getTrafficMatrixHereAction({
    origins: matrixSourceCoords,
    destinations: uniqueInitialPois.map(p => ({ 
      lat: parseFloat(p.lat), 
      lng: parseFloat(p.lon) 
    }))
  });
} else {
  // Use ORS for Free/Plus users
  const allPoints = [
    ...matrixSourceCoords.map(c => ({ lon: c.lng, lat: c.lat })),
    ...uniqueInitialPois.map(p => ({ lon: p.lon, lat: p.lat }))
  ];
  
  const matrixResult = await getTravelTimeMatrixAction(
    coordinatesString,
    sourcesString,
    destinationsString
  );
}
```

## Data Structures

### Location Input
```typescript
interface LocationInput {
  address: string;
  coordinates: { lat: number; lng: number } | null;
}
```

### Geocoded Origin
```typescript
interface GeocodedOrigin {
  lat: string;
  lng: string;
  display_name: string;
  // Additional LocationIQ response fields
}
```

### Enriched POI
```typescript
interface EnrichedPoi extends PoiResponse {
  travelInfo: TravelInfo[];
}

interface TravelInfo {
  sourceIndex: number;
  duration: number | null; // seconds
  distance: number | null; // meters
}
```

## User Interface Components

### Location Input Form
- **Dynamic Fields**: Add/remove location inputs
- **Autocomplete**: Geocoding suggestions as user types
- **Validation**: Real-time validation with error messages
- **Tier Enforcement**: Upgrade prompts when limits exceeded

### Results Display
- **Map View**: Visual representation of all locations and meeting point
- **List View**: Detailed travel information for each POI
- **Summary**: Total travel time and distance calculations
- **Filters**: POI type filtering and sorting options

### Travel Time Display
```typescript
// Example: Display travel times from all origins
{poi.travelInfo.map((travel, index) => (
  <div key={index} className="travel-info">
    <span>From Location {index + 1}:</span>
    <span>{formatDuration(travel.duration)}</span>
    <span>{formatDistance(travel.distance)}</span>
  </div>
))}
```

## Performance Considerations

### Optimization Strategies
- **Debounced Geocoding**: Prevent excessive API calls during typing
- **Batch Processing**: Single matrix API call for all origins
- **Efficient Rendering**: Virtualized lists for large POI datasets
- **Map Performance**: Optimized marker clustering and bounds

### Scalability Limits
- **Matrix Size**: Origins × Destinations limited by API constraints
- **Memory Usage**: Large datasets handled efficiently
- **Response Times**: Acceptable performance for maximum tier limits

## Error Handling

### Common Error Scenarios
1. **Geocoding Failures**: Invalid addresses or API errors
2. **Matrix API Errors**: Network issues or quota exceeded
3. **POI Search Failures**: No results or API timeouts
4. **Tier Limit Exceeded**: Upgrade modal triggered

### Error Recovery
```typescript
// Example: Graceful degradation for matrix failures
if (hereMatrixResult.error) {
  console.error('Matrix calculation failed:', hereMatrixResult.error);
  setMatrixError(hereMatrixResult.error);
  // Show POIs without travel time data
  finalCombinedPois = uniqueInitialPois.map(p => ({ ...p, travelInfo: [] }));
}
```

## Tier Enforcement

### Validation Logic
```typescript
const getMaxLocations = (tier: Tier): number => {
  switch (tier) {
    case 'starter': return 2;
    case 'plus': return 3;
    case 'pro': return 5;
    case 'business': return 10;
    default: return 2;
  }
};

// Enforce limits in form component
if (locations.length >= maxLocationsForTier) {
  onOpenUpgradeModal?.();
  return;
}
```

### Upgrade Flow
1. User attempts to add location beyond tier limit
2. Upgrade modal displays with tier-specific messaging
3. User can upgrade subscription or remove locations
4. Form updates dynamically based on new tier limits

## Analytics & Tracking

### Key Metrics
- **Multi-Origin Usage**: Percentage of searches with 3+ locations
- **Tier Distribution**: Usage patterns by subscription tier
- **Success Rates**: Completion rates for multi-origin searches
- **Performance**: Response times for different origin counts

### Event Tracking
```typescript
// Track multi-origin search events
await trackEvent('multi_origin_search', {
  origin_count: geocodedOrigins.length,
  user_tier: currentTier,
  success: searchSuccessful,
  duration: searchDuration
});
```

## Testing Scenarios

### Functional Testing
1. **2-Location Search**: Traditional midpoint calculation
2. **3-Location Search**: Basic multi-origin functionality
3. **Maximum Locations**: Test tier limits (5 for Pro, 10 for Business)
4. **Tier Enforcement**: Upgrade modal triggers
5. **Error Handling**: API failures and network issues

### Performance Testing
1. **Large Matrix**: Maximum origins × destinations
2. **Response Times**: Acceptable performance under load
3. **Memory Usage**: Efficient handling of large datasets
4. **Concurrent Users**: Multiple simultaneous searches

### User Experience Testing
1. **Form Usability**: Adding/removing locations
2. **Results Clarity**: Understanding multi-origin results
3. **Mobile Experience**: Touch-friendly interface
4. **Accessibility**: Screen reader and keyboard navigation

## Future Enhancements

### Planned Features
1. **Route Optimization**: Optimal meeting point algorithms
2. **Time Windows**: Consider availability constraints
3. **Transportation Modes**: Public transit, walking, cycling
4. **Group Preferences**: Weight locations by importance
5. **Historical Data**: Learn from past meeting preferences

### Technical Improvements
1. **Advanced Algorithms**: Machine learning for optimal points
2. **Real-time Collaboration**: Live location sharing
3. **Offline Support**: Cached data for poor connectivity
4. **Performance Optimization**: Further speed improvements

## Troubleshooting

### Common Issues

#### 1. Geocoding Problems
- **Invalid Addresses**: Clear error messages and suggestions
- **API Rate Limits**: Debouncing and retry mechanisms
- **Ambiguous Locations**: Multiple result handling

#### 2. Matrix Calculation Issues
- **Large Matrices**: Chunking for API limits
- **Network Timeouts**: Retry with exponential backoff
- **Partial Failures**: Graceful degradation

#### 3. Performance Issues
- **Slow Rendering**: Virtualization and optimization
- **Memory Leaks**: Proper cleanup and garbage collection
- **Map Performance**: Efficient marker management

### Debug Tools
- **Browser DevTools**: Network and performance monitoring
- **Console Logging**: Detailed operation tracking
- **PostHog Analytics**: User behavior analysis
- **Error Monitoring**: Sentry or similar tools

## Related Documentation
- [App Structure](app-structure.md)
- [Subscription & Billing](SUBSCRIPTION_BILLING.md)
- [HERE API Integration](HERE_API_INTEGRATION.md)
- [Upgrade Modal Implementation](UPGRADE_MODAL_IMPLEMENTATION.md)

---

*This documentation covers the complete multi-origin feature implementation. The feature is production-ready and actively used by Pro and Business tier subscribers.* 