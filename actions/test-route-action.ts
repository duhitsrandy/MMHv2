import { ActionState } from "@/types/action-types";

interface RouteResponse {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
}

export async function testRouteAction(
  startLat: string,
  startLon: string,
  endLat: string,
  endLon: string
): Promise<ActionState<RouteResponse>> {
  console.log(`[Test Route] Starting calculation from (${startLat},${startLon}) to (${endLat},${endLon})`);

  try {
    const response = await fetch('/api/ors/test-route', {
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
      console.error(`[Test Route] API error: ${response.status} - ${response.statusText}`);
      console.error(`[Test Route] Error details: ${errorText}`);
      return {
        isSuccess: false,
        message: "Failed to calculate route"
      };
    }

    const data = await response.json();
    console.log('[Test Route] API response:', JSON.stringify(data, null, 2));

    // Handle the response format from Replit's approach
    if (!data || !data.routes || data.routes.length === 0) {
      console.warn('[Test Route] No routes found in response');
      return {
        isSuccess: false,
        message: "No route found between the provided locations"
      };
    }

    // Get the main route (first route)
    const mainRoute = data.routes[0];
    const mainDistance = mainRoute.summary.distance;
    const alternatives = data.routes.slice(1);

    console.log(`[Test Route] Found ${alternatives.length} alternative routes`);
    console.log(`[Test Route] Main route distance: ${mainDistance}m`);

    // Find the first suitable alternative
    let suitableAlternative = null;
    for (const route of alternatives) {
      const distance = route.summary.distance;
      console.log(`[Test Route] Checking alternative with distance: ${distance}m`);
      
      if (distance <= mainDistance * 1.4) {
        suitableAlternative = route;
        break;
      }
    }

    if (suitableAlternative) {
      const properties = suitableAlternative.summary;
      console.log(`[Test Route] Selected alternative with distance: ${properties.distance}m`);
      return {
        isSuccess: true,
        message: "Route calculated successfully",
        data: {
          distance: properties.distance,
          duration: properties.duration,
          geometry: suitableAlternative.geometry
        }
      };
    }

    console.warn(`[Test Route] No suitable alternative found within ${mainDistance * 1.4}m distance limit`);
    return {
      isSuccess: false,
      message: "No suitable alternative route found"
    };
  } catch (error) {
    console.error("[Test Route] Error processing request:", error);
    return {
      isSuccess: false,
      message: "Failed to calculate route"
    };
  }
} 