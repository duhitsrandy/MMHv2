# HERE API Integration Documentation

## Overview
The HERE API integration provides real-time traffic data and advanced routing capabilities for Pro and Business tier users. This document covers the implementation, configuration, and usage of HERE's Matrix Routing API v8.

## Purpose & Benefits

### Why HERE API?
- **Real-time Traffic Data**: Provides current traffic conditions for accurate ETAs
- **Advanced Routing**: More sophisticated routing algorithms than basic services
- **Enterprise Grade**: Reliable, scalable service for production use
- **Global Coverage**: Worldwide routing and traffic data

### Pro Tier Differentiation
- **Free/Plus Tiers**: Use OpenRouteService (ORS) for basic travel time calculations
- **Pro/Business Tiers**: Use HERE API for traffic-aware, real-time calculations
- **Value Proposition**: More accurate meeting point suggestions with current traffic

## API Configuration

### Environment Variables
```env
# HERE API Configuration
HERE_API_KEY=your_here_api_key_here

# Optional: HERE API Host (defaults to production)
HERE_API_HOST=https://matrix.router.hereapi.com
```

### API Endpoints Used
- **Matrix Routing API v8**: `https://matrix.router.hereapi.com/v8/matrix`
- **Documentation**: [HERE Matrix Routing API](https://developer.here.com/documentation/matrix-routing-api)

## Implementation Architecture

### Core Files

#### 1. HERE Platform Provider
**File**: `lib/providers/here-platform.ts`

**Key Functions**:
- `getTravelTimeMatrixHere()`: Main matrix calculation function
- `getRouteWithTrafficHere()`: Single route with traffic (optional)

#### 2. HERE Actions
**File**: `app/actions/here-actions.ts`

**Server Actions**:
- `getTrafficMatrixHereAction()`: Protected action for Pro users

#### 3. Plan Enforcement
**File**: `lib/auth/plan.ts`

**Protection**:
- `requireProPlan()`: Ensures only Pro/Business users access HERE API

### Request/Response Flow

#### 1. User Initiates Search
```typescript
// In results-map.tsx
if (plan === 'pro') {
  console.log('PRO plan: Fetching travel times with HERE Matrix API');
  const hereResult = await getTrafficMatrixHereAction({
    origins: hereOrigins,
    destinations: hereDestinations
  });
}
```

#### 2. Action Processing
```typescript
// In here-actions.ts
export async function getTrafficMatrixHereAction(params: MatrixActionParams) {
  // Ensure user is on a Pro plan
  await requireProPlan();
  
  const result = await getTravelTimeMatrixHere({
    origins: params.origins,
    destinations: params.destinations,
  });
  
  return { success: true, data: result.data };
}
```

#### 3. API Call
```typescript
// In here-platform.ts
const requestBody = {
  origins: params.origins.map(o => ({ lat: o.lat, lng: o.lng })),
  destinations: params.destinations.map(d => ({ lat: d.lat, lng: d.lng })),
  regionDefinition: { type: "world" },
  routingMode: "fast",
  transportMode: "car",
  matrixAttributes: ["travelTimes", "distances"]
};

const response = await fetch(hereMatrixApiUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(requestBody),
});
```

## API Request Structure

### Matrix Request Parameters
```typescript
interface HereMatrixParams {
  origins: Array<{ lat: number; lng: number }>;
  destinations: Array<{ lat: number; lng: number }>;
}
```

### HERE API Request Body
```json
{
  "origins": [
    { "lat": 40.7128, "lng": -74.0060 }
  ],
  "destinations": [
    { "lat": 40.7851, "lng": -73.9683 }
  ],
  "regionDefinition": { "type": "world" },
  "routingMode": "fast",
  "transportMode": "car",
  "matrixAttributes": ["travelTimes", "distances"]
}
```

### Configuration Options
- **regionDefinition**: `{ type: "world" }` for global flexible mode with traffic
- **routingMode**: `"fast"` for optimal routing
- **transportMode**: `"car"` for driving routes
- **matrixAttributes**: `["travelTimes", "distances"]` for required data
- **departureTime**: Omitted to default to "now" for live traffic

## Response Processing

### HERE API Response Structure
```json
{
  "matrixId": "unique_matrix_id",
  "matrix": {
    "numOrigins": 1,
    "numDestinations": 1,
    "travelTimes": [900],
    "distances": [5000],
    "errorCodes": [0]
  },
  "regionDefinition": { "type": "world" }
}
```

### Processed Response
```typescript
interface ProcessedHereMatrixResponse {
  travelTimes: (number | null)[][];
  distances: (number | null)[][];
}
```

### Data Transformation
The flat arrays from HERE API are converted to 2D arrays:
```typescript
// Unflatten the arrays
for (let i = 0; i < numOrigins; i++) {
  travelTimes[i] = [];
  distances[i] = [];
  for (let j = 0; j < numDestinations; j++) {
    const k = (numDestinations * i) + j;
    const errorCode = flatErrorCodes ? flatErrorCodes[k] : 0;
    
    if (errorCode === 0) {
      travelTimes[i][j] = flatTravelTimes[k];
      distances[i][j] = flatDistances[k];
    } else {
      travelTimes[i][j] = null;
      distances[i][j] = null;
    }
  }
}
```

## Integration Points

### 1. Results Map Component
**File**: `app/meet-me-halfway/_components/results-map.tsx`

#### Plan Detection
```typescript
const { tier } = usePlan();
const plan: UserPlan | null = tier === 'pro' || tier === 'business' ? 'pro' : 
                              tier === 'starter' || tier === 'plus' ? 'free' : 
                              null;
```

#### Conditional API Usage
```typescript
if (plan === 'pro') {
  // Use HERE API for Pro users
  const hereMatrixResult = await getTrafficMatrixHereAction({
    origins: hereOrigins,
    destinations: hereDestinations
  });
} else {
  // Use ORS for Free/Plus users
  const matrixResult = await getTravelTimeMatrixAction(
    coordinatesString,
    sourcesString,
    destinationsString
  );
}
```

### 2. POI Enrichment
The HERE API results are used to enrich POI data with accurate travel times:
```typescript
const poisWithTravelTimes = uniqueInitialPois.map((poi, poiIdx): EnrichedPoi => {
  const travelInfo: TravelInfo[] = [];
  matrixSourceCoords.forEach((_, srcIdx) => {
    travelInfo.push({
      sourceIndex: srcIdx,
      duration: hereTravelTimes[srcIdx]?.[poiIdx] ?? null,
      distance: hereDistances[srcIdx]?.[poiIdx] ?? null
    });
  });
  return { ...poi, travelInfo };
});
```

## Error Handling

### API Error Types
```typescript
interface HereApiError {
  title?: string;
  cause?: string;
  action?: string;
}
```

### Error Scenarios

#### 1. Authentication Errors
- **Missing API Key**: Clear error message with setup instructions
- **Invalid API Key**: Verification steps and support contact
- **Quota Exceeded**: Upgrade messaging and usage monitoring

#### 2. Request Errors
- **Invalid Coordinates**: Input validation and user feedback
- **Too Many Locations**: Tier limit enforcement
- **Network Timeouts**: Retry mechanism with exponential backoff

#### 3. Response Errors
- **Malformed Response**: Fallback to ORS if available
- **Partial Failures**: Handle individual cell errors gracefully
- **Service Unavailable**: Temporary fallback with user notification

### Fallback Strategy
```typescript
if (hereMatrixResult.error) {
  console.error('HERE Matrix fetch failed:', hereMatrixResult.error);
  setMatrixError(hereMatrixResult.error);
  // Fallback: POIs without travel times or try ORS
  finalCombinedPois = uniqueInitialPois.map(p => ({ ...p, travelInfo: [] }));
}
```

## Performance Considerations

### Request Optimization
- **Batch Processing**: Multiple destinations in single request
- **Coordinate Precision**: Optimal precision for accuracy vs. performance
- **Caching**: Consider caching for frequently requested routes

### Response Handling
- **Streaming**: Process large matrices efficiently
- **Memory Management**: Handle large response datasets
- **Timeout Configuration**: Appropriate timeouts for user experience

## Rate Limiting & Quotas

### HERE API Limits
- **Requests per Second**: Varies by plan
- **Monthly Quota**: Based on HERE subscription
- **Matrix Size**: Maximum origins × destinations per request

### Application Rate Limiting
- **User Tier Limits**: Additional restrictions based on subscription
- **Global Rate Limiting**: Upstash Redis implementation
- **Fair Usage**: Prevent abuse while maintaining service quality

## Monitoring & Analytics

### Key Metrics
- **API Success Rate**: HERE API response success percentage
- **Response Times**: Average API response duration
- **Error Rates**: Types and frequency of API errors
- **Usage Patterns**: Peak usage times and geographic distribution

### Tracking Implementation
```typescript
// Example: Track HERE API usage
await trackEvent('here_api_matrix_request', {
  origins_count: origins.length,
  destinations_count: destinations.length,
  success: result.success,
  duration: responseTime,
  error: result.error || null
});
```

### Alerting
- **API Downtime**: Immediate alerts for service issues
- **Error Spikes**: Threshold-based error rate monitoring
- **Quota Warnings**: Proactive quota usage alerts
- **Performance Degradation**: Response time monitoring

## Testing

### Development Testing
```env
# Use HERE test/development API key
HERE_API_KEY=test_api_key_here
```

### Test Scenarios
1. **Successful Matrix Request**: Valid origins and destinations
2. **Invalid Coordinates**: Out-of-bounds or malformed coordinates
3. **Large Matrix**: Maximum allowed origins/destinations
4. **Network Failures**: Timeout and connection error handling
5. **API Errors**: Various HERE API error responses

### Mock Data
For development and testing without API calls:
```typescript
const mockHereResponse = {
  travelTimes: [[900, 1200], [1100, 800]],
  distances: [[5000, 6500], [5800, 4200]]
};
```

## Security Considerations

### API Key Protection
- **Environment Variables**: Never commit API keys to version control
- **Server-Side Only**: API calls made from secure server environment
- **Key Rotation**: Regular API key rotation schedule
- **Access Monitoring**: Track API key usage and access patterns

### Data Privacy
- **Location Data**: Minimal location data retention
- **User Privacy**: No unnecessary location tracking
- **GDPR Compliance**: Proper data handling and user consent

## Cost Management

### Usage Optimization
- **Efficient Batching**: Minimize API calls through smart batching
- **Caching Strategy**: Cache results for repeated requests
- **Tier Enforcement**: Strict enforcement of usage limits per tier

### Cost Monitoring
- **Usage Tracking**: Monitor API calls per user and tier
- **Budget Alerts**: Automated alerts for cost thresholds
- **Usage Analytics**: Identify optimization opportunities

## Troubleshooting

### Common Issues

#### 1. API Key Issues
```bash
# Test API key validity
curl -X POST "https://matrix.router.hereapi.com/v8/matrix?apiKey=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"origins":[{"lat":52.5,"lng":13.4}],"destinations":[{"lat":52.5,"lng":13.4}]}'
```

#### 2. Response Format Issues
- Check API version compatibility
- Verify request body structure
- Review response parsing logic

#### 3. Performance Issues
- Monitor API response times
- Check network connectivity
- Review request size and complexity

### Debug Tools
- **HERE Developer Portal**: API usage and error monitoring
- **Application Logs**: Detailed request/response logging
- **Network Tools**: Request inspection and debugging
- **PostHog Analytics**: User experience impact analysis

## Future Enhancements

### Planned Features
1. **Route Optimization**: Multi-stop route optimization
2. **Alternative Routes**: Multiple route options with traffic
3. **Real-time Updates**: Live traffic condition updates
4. **Historical Data**: Traffic pattern analysis
5. **Isochrone Analysis**: Travel time polygons

### Technical Improvements
1. **Caching Layer**: Redis caching for frequent requests
2. **Batch Processing**: Optimized batch request handling
3. **Fallback Chain**: Multiple API provider fallbacks
4. **Performance Monitoring**: Advanced performance analytics

## Related Documentation
- [Subscription & Billing](SUBSCRIPTION_BILLING.md)
- [App Structure](app-structure.md)
- [API Documentation](api-docs.md)
- [Multi-Origin Feature](MULTI_ORIGIN_FEATURE.md)

---

*This documentation covers the complete HERE API integration. For the latest API features and pricing, refer to the HERE Developer Portal.* 