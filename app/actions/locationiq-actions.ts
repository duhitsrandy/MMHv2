import { ActionState } from "@/types"
import { rateLimitedFetch } from "@/actions/locationiq-actions"

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function getAlternateRouteAction(
  startLat: string,
  startLon: string,
  endLat: string,
  endLon: string
): Promise<ActionState<any>> {
  try {
    // Validate coordinates
    if (!startLat || !startLon || !endLat || !endLon) {
      return {
        isSuccess: false as const,
        message: "Missing coordinates for alternate route calculation"
      }
    }
    
    // Ensure coordinates are valid numbers
    const coords = [
      parseFloat(startLat), parseFloat(startLon),
      parseFloat(endLat), parseFloat(endLon)
    ];
    
    if (coords.some(isNaN)) {
      return {
        isSuccess: false as const,
        message: "Invalid coordinates for alternate route calculation"
      }
    }

    // Request route with alternatives
    // Using OSRM parameters:
    // alternatives=3: Request up to 3 alternative routes
    // steps=false: We don't need turn-by-turn directions
    // geometries=geojson: Get route geometry in GeoJSON format
    // overview=full: Get full route geometry
    const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?alternatives=3&steps=false&geometries=geojson&overview=full`

    const response = await rateLimitedFetch(url)
    if (!response.ok) {
      console.warn(`OSRM API error for alternate route: ${response.statusText}. Using fallback route data.`);
      return createFallbackRoute(startLat, startLon, endLat, endLon);
    }

    const data = await response.json()
    if (!data || !data.routes || data.routes.length === 0) {
      return {
        isSuccess: false as const,
        message: "No alternate route found between the provided locations"
      }
    }

    // If we have multiple routes, choose the most suitable alternate
    if (data.routes.length > 1) {
      // Get the main route for reference
      const mainRoute = data.routes[0];
      const mainDistance = mainRoute.distance;

      // Filter and score alternative routes
      const alternativeRoutes = data.routes.slice(1)
        .map((route: any) => ({
          ...route,
          // Score based on how different the route is (higher is better)
          score: calculateRouteScore(route, mainRoute)
        }))
        .filter((route: { distance: number; score: number }) => {
          // Filter routes that are too similar or too long
          const isTooLong = route.distance > mainDistance * 1.4; // Max 40% longer
          const isTooSimilar = route.score < 0.4; // Must be at least 40% different
          return !isTooLong && !isTooSimilar;
        })
        .sort((a: { score: number }, b: { score: number }) => b.score - a.score); // Sort by score descending

      if (alternativeRoutes.length > 0) {
        // Return the highest scoring alternate route
        return {
          isSuccess: true as const,
          message: "Alternate route calculated successfully",
          data: alternativeRoutes[0]
        }
      }
    }

    // If no suitable alternative found, create a fallback
    return createFallbackRoute(startLat, startLon, endLat, endLon);
  } catch (error) {
    console.error("Error calculating alternate route:", error)
    return createFallbackRoute(startLat, startLon, endLat, endLon);
  }
}

// Helper function to create a fallback route
function createFallbackRoute(startLat: string, startLon: string, endLat: string, endLon: string): ActionState<any> {
  try {
    const directDistance = calculateDistance(
      parseFloat(startLat), parseFloat(startLon),
      parseFloat(endLat), parseFloat(endLon)
    );

    // Create a simple route with a slight detour
    const midLat = (parseFloat(startLat) + parseFloat(endLat)) / 2;
    const midLon = (parseFloat(startLon) + parseFloat(endLon)) / 2;
    
    // Add a slight offset to the midpoint
    const dx = parseFloat(endLon) - parseFloat(startLon);
    const dy = parseFloat(endLat) - parseFloat(startLat);
    const angle = Math.atan2(dy, dx) + Math.PI / 2; // Perpendicular angle
    const offset = 0.01; // About 1km offset
    
    const detourLat = midLat + Math.sin(angle) * offset;
    const detourLon = midLon + Math.cos(angle) * offset;

    return {
      isSuccess: true as const,
      message: "Alternate route estimated (fallback)",
      data: {
        distance: directDistance * 1.2, // 20% longer than direct route
        duration: (directDistance / 13.89) * 1.2, // Assuming ~50 km/h average speed
        geometry: {
          coordinates: [
            [parseFloat(startLon), parseFloat(startLat)],
            [detourLon, detourLat],
            [parseFloat(endLon), parseFloat(endLat)]
          ],
          type: "LineString"
        }
      }
    }
  } catch (fallbackError) {
    return { 
      isSuccess: false as const, 
      message: "Failed to calculate alternate route and fallback also failed" 
    }
  }
}

// Helper function to calculate how different a route is from the main route
function calculateRouteScore(route: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }, mainRoute: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }): number {
  // Calculate score based on multiple factors
  const distanceScore = Math.abs(route.distance - mainRoute.distance) / mainRoute.distance;
  const durationScore = Math.abs(route.duration - mainRoute.duration) / mainRoute.duration;
  
  // Calculate path difference score
  let pathDifferenceScore = 0;
  const mainCoords = mainRoute.geometry.coordinates;
  const altCoords = route.geometry.coordinates;
  
  // Sample points along both routes and compare distances
  const numSamples = 10;
  for (let i = 0; i < numSamples; i++) {
    const mainIndex = Math.floor((i / numSamples) * (mainCoords.length - 1));
    const altIndex = Math.floor((i / numSamples) * (altCoords.length - 1));
    
    const mainPoint = mainCoords[mainIndex];
    const altPoint = altCoords[altIndex];
    
    // Calculate distance between corresponding points
    const distance = Math.sqrt(
      Math.pow(mainPoint[0] - altPoint[0], 2) +
      Math.pow(mainPoint[1] - altPoint[1], 2)
    );
    
    pathDifferenceScore += distance;
  }
  
  // Normalize path difference score
  pathDifferenceScore = pathDifferenceScore / numSamples;
  
  // Combine scores with weights
  return (distanceScore * 0.3) + (durationScore * 0.3) + (pathDifferenceScore * 0.4);
} 