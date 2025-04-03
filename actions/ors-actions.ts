import { ActionState } from "@/types"
import { PoiResponse } from "@/types/poi-types"

interface RouteResponse {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
}

interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
}

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

export async function geocodeLocationAction(
  address: string
): Promise<ActionState<GeocodingResult>> {
  try {
    console.log('Geocoding address:', address);
    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    if (!apiKey) {
      console.error('OpenRouteService API key is missing');
      return {
        isSuccess: false,
        message: "OpenRouteService API key is not configured"
      };
    }

    const response = await fetch('/api/ors/geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Geocoding API error:', response.status, '-', response.statusText);
      console.error('Error details:', errorText);
      return {
        isSuccess: false,
        message: "Failed to geocode location"
      };
    }

    const data = await response.json();
    console.log('Geocoding API response:', data);

    if (!data || !data.features || data.features.length === 0) {
      return {
        isSuccess: false,
        message: "No results found for the provided address"
      };
    }

    const feature = data.features[0];
    return {
      isSuccess: true,
      message: "Location geocoded successfully",
      data: {
        lat: feature.geometry.coordinates[1].toString(),
        lon: feature.geometry.coordinates[0].toString(),
        display_name: feature.properties.label
      }
    };
  } catch (error) {
    console.error("Error geocoding location:", error);
    return { isSuccess: false, message: "Failed to geocode location" };
  }
}

export async function testAlternateAction(
  startLat: string,
  startLon: string,
  endLat: string,
  endLon: string
): Promise<ActionState<RouteResponse>> {
  console.log(`[Test Alternate] Starting calculation from (${startLat},${startLon}) to (${endLat},${endLon})`);

  try {
    // Validate coordinates
    if (!startLat || !startLon || !endLat || !endLon) {
      return {
        isSuccess: false,
        message: "Missing coordinates for alternate route calculation"
      };
    }
    
    // Ensure coordinates are valid numbers
    const coords = [
      parseFloat(startLat), parseFloat(startLon),
      parseFloat(endLat), parseFloat(endLon)
    ];
    
    if (coords.some(isNaN)) {
      return {
        isSuccess: false,
        message: "Invalid coordinates for alternate route calculation"
      };
    }

    const response = await fetch('/api/ors/test-alternate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startLat,
        startLon,
        endLat,
        endLon
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Test Alternate] API error: ${response.status} - ${response.statusText}`);
      console.error(`[Test Alternate] Error details: ${errorText}`);
      return createFallbackRoute(startLat, startLon, endLat, endLon);
    }

    const data = await response.json();
    console.log('[Test Alternate] API response:', JSON.stringify(data, null, 2));

    // Handle standard ORS response format (routes array)
    if (!data || !data.routes || data.routes.length === 0) {
      console.warn('[Test Alternate] No routes found in response');
      return createFallbackRoute(startLat, startLon, endLat, endLon);
    }

    // If we have multiple routes, choose the most suitable alternate
    if (data.routes.length > 1) {
      const mainRoute = data.routes[0];
      const alternatives = data.routes.slice(1);
      
      // Find a suitable alternative that isn't too much longer
      const suitableAlternative = alternatives.find((route: { summary: { distance: number } }) => 
        route.summary.distance <= mainRoute.summary.distance * 1.4 // Max 40% longer
      );

      if (suitableAlternative) {
        return {
          isSuccess: true,
          message: "Alternate route calculated successfully",
          data: {
            distance: suitableAlternative.summary.distance,
            duration: suitableAlternative.summary.duration,
            geometry: suitableAlternative.geometry
          }
        };
      }
    }

    // If no suitable alternative found, create a fallback
    return createFallbackRoute(startLat, startLon, endLat, endLon);
  } catch (error) {
    console.error("[Test Alternate] Error processing request:", error);
    return createFallbackRoute(startLat, startLon, endLat, endLon);
  }
}

// Helper function to create a fallback route
function createFallbackRoute(startLat: string, startLon: string, endLat: string, endLon: string): ActionState<RouteResponse> {
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
    const offset = directDistance * 0.15 / 111000; // 15% of route distance, converted to degrees
    
    const detourLat = midLat + Math.sin(angle) * offset;
    const detourLon = midLon + Math.cos(angle) * offset;

    return {
      isSuccess: true,
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
    };
  } catch (fallbackError) {
    return { 
      isSuccess: false, 
      message: "Failed to calculate alternate route and fallback also failed" 
    };
  }
}

const OSRM_API_BASE = "https://router.project-osrm.org";

// --- Get Travel Time Matrix (OSRM Table Service) ---
interface MatrixResponse {
  code: string;
  durations?: number[][]; // Optional: Might be null if routes aren't found
  distances?: number[][]; // Optional: Might be null if routes aren't found
  message?: string; // Error message from OSRM
}

interface MatrixData {
  durations: number[][] | null;
  distances: number[][] | null;
}

export async function getTravelTimeMatrixAction(
  coordinates: string, // Format: "lon1,lat1;lon2,lat2;..."
  sources: string, // Format: "idx1;idx2;..." (indices from coordinates)
  destinations: string // Format: "idx1;idx2;..." (indices from coordinates)
): Promise<ActionState<MatrixData>> {
  console.log("[Matrix Calculation] Requesting travel time matrix from OSRM");

  if (!coordinates || !sources || !destinations) {
    return { isSuccess: false, message: "Missing required parameters for matrix calculation." };
  }

  // Construct the OSRM Table API URL
  // Example: /table/v1/driving/lon1,lat1;lon2,lat2?sources=0&destinations=1&annotations=duration,distance
  const apiUrl = `${OSRM_API_BASE}/table/v1/driving/${coordinates}?sources=${sources}&destinations=${destinations}&annotations=duration,distance`;
  console.log("[Matrix Calculation] OSRM Table URL:", apiUrl);

  try {
    // Perform the fetch call SERVER-SIDE
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Add cache control if desired, e.g., cache for an hour
      next: { revalidate: 3600 } 
    });

    if (!response.ok) {
      // Handle HTTP errors (e.g., 4xx, 5xx)
      let errorBody = "Unknown error";
      try {
          // Try to parse OSRM error message if available
          const errorJson = await response.json();
          errorBody = errorJson.message || `HTTP error ${response.status}`;
      } catch (e) {
          errorBody = `HTTP error ${response.status}`;
      }
      console.error("[Matrix Calculation] OSRM API Error:", errorBody);
      return { isSuccess: false, message: `OSRM API Error: ${errorBody}` };
    }

    const matrixResult: MatrixResponse = await response.json();
    console.log("[Matrix Calculation] OSRM API Raw Response:", matrixResult);

    if (matrixResult.code !== "Ok") {
      console.error("[Matrix Calculation] OSRM returned non-Ok code:", matrixResult.code, matrixResult.message);
      return { 
        isSuccess: false, 
        message: `OSRM Error: ${matrixResult.message || matrixResult.code}` 
      };
    }

    // Check if durations/distances are present (they might be null if some routes failed)
    if (!matrixResult.durations || !matrixResult.distances) {
        console.warn("[Matrix Calculation] OSRM response missing durations or distances.");
        // Return success but with null data, indicating partial failure
        return { 
            isSuccess: true, // Still considered a success in terms of API call
            message: "Matrix calculated, but some routes might have failed.",
            data: { durations: matrixResult.durations || null, distances: matrixResult.distances || null }
        };
    }

    console.log("[Matrix Calculation] Successfully fetched and processed matrix data.");
    return {
      isSuccess: true,
      message: "Travel time matrix calculated successfully.",
      data: { 
          durations: matrixResult.durations,
          distances: matrixResult.distances
       },
    };

  } catch (error) {
    console.error("[Matrix Calculation] Network or processing error:", error);
    // Handle network errors or JSON parsing errors
    let errorMessage = "Failed to fetch or process travel time matrix.";
    if (error instanceof Error) {
      errorMessage = error.message; // More specific error message if available
    }
    return { isSuccess: false, message: errorMessage };
  }
} 