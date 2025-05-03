import { GeocodedOrigin, OsrmRoute, Point } from "@/types"; // Assuming Point type exists

// Placeholder for geometric center calculation
export function calculateCentroid(points: Point[]): { lat: number; lng: number } | null {
  if (!points || points.length === 0) {
    return null;
  }
  let sumLat = 0;
  let sumLng = 0;
  points.forEach(p => {
    sumLat += p.lat;
    sumLng += p.lng;
  });
  return { lat: sumLat / points.length, lng: sumLng / points.length };
}

// Function to calculate Haversine distance between two points
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Calculate the geographic midpoint along a route based on 50% of its total distance
export function calculateMidpointFromRoute(route: OsrmRoute | null): { lat: number; lng: number } | null {
  // Validate route object and its essential properties
  if (!route?.geometry?.coordinates || route.geometry.coordinates.length < 2 || typeof route.distance !== 'number') {
    console.warn("[MidpointCalc] Invalid route object provided:", route);
    return null;
  }

  const coordinates = route.geometry.coordinates; // Expected format: [lon, lat]
  const totalDistance = route.distance; // Total route distance in meters
  const targetDistance = totalDistance / 2; // Target distance for the midpoint
  let cumulativeDistance = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lon1, lat1] = coordinates[i];
    const [lon2, lat2] = coordinates[i + 1];

    // Basic validation for coordinates
    if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || typeof lat2 !== 'number' || typeof lon2 !== 'number') {
      console.warn(`[MidpointCalc] Invalid coordinates in segment ${i}:`, coordinates[i], coordinates[i+1]);
      continue; // Skip this segment
    }

    const segmentDistance = calculateDistance(lat1, lon1, lat2, lon2);

    // Check if the midpoint falls within this segment
    if (cumulativeDistance + segmentDistance >= targetDistance) {
      const remainingDistance = targetDistance - cumulativeDistance;
      // Handle potential division by zero if segment distance is 0
      const ratio = segmentDistance === 0 ? 0 : remainingDistance / segmentDistance;

      // Check for invalid ratio (can happen with floating point issues or zero segment distance)
       if (isNaN(ratio) || !isFinite(ratio) || ratio < 0 || ratio > 1) {
         console.warn(`[MidpointCalc] Invalid ratio (${ratio}) calculated for segment ${i}. Using start of segment.`, {
           targetDistance,
           cumulativeDistance,
           segmentDistance,
           remainingDistance
         });
         // Fallback to the starting point of the segment where the midpoint should lie
         return { lat: lat1, lng: lon1 }; 
       }

      // Interpolate latitude and longitude
      const midLat = lat1 + ratio * (lat2 - lat1);
      const midLon = lon1 + ratio * (lon2 - lon1);

      // Final check for NaN coordinates after interpolation
       if (isNaN(midLat) || isNaN(midLon)) {
         console.warn(`[MidpointCalc] Calculated midpoint coordinates are NaN after interpolation. Using start of segment.`, { lat1, lon1, lat2, lon2, ratio });
         return { lat: lat1, lng: lon1 };
       }

      console.log(`[MidpointCalc] Midpoint found in segment ${i} at ratio ${ratio.toFixed(3)}`);
      return { lat: midLat, lng: midLon };
    }

    cumulativeDistance += segmentDistance;
  }

  // Fallback: If midpoint wasn't found (e.g., due to calculation issues or short route)
  console.warn("[MidpointCalc] Midpoint not found along segments. Returning the last coordinate as fallback.");
  const lastCoord = coordinates[coordinates.length - 1];
  if (lastCoord && typeof lastCoord[0] === 'number' && typeof lastCoord[1] === 'number') {
      return { lat: lastCoord[1], lng: lastCoord[0] };
  }

  return null; // Should ideally not be reached if input validation is good
} 