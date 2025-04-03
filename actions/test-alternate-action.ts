import { ActionState } from "@/types/action-types";

interface RouteResponse {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
}

export async function testAlternateAction(
  startLat: string,
  startLon: string,
  endLat: string,
  endLon: string
): Promise<ActionState<RouteResponse>> {
  console.log(`[Test Alternate] Starting calculation from (${startLat},${startLon}) to (${endLat},${endLon})`);

  try {
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
      return {
        isSuccess: false,
        message: "Failed to calculate route"
      };
    }

    const data = await response.json();
    console.log('[Test Alternate] API response:', JSON.stringify(data, null, 2));

    // Handle GeoJSON response format
    if (!data || !data.features || data.features.length === 0) {
      console.warn('[Test Alternate] No routes found in response');
      return {
        isSuccess: false,
        message: "No route found between the provided locations"
      };
    }

    // Get the main route (first feature)
    const mainRoute = data.features[0];
    const mainDistance = mainRoute.properties.segments[0].distance;
    const alternatives = data.features.slice(1);

    console.log(`[Test Alternate] Found ${alternatives.length} alternative routes`);
    console.log(`[Test Alternate] Main route distance: ${mainDistance}m`);

    // Find the first suitable alternative
    let suitableAlternative = null;
    for (const route of alternatives) {
      const distance = route.properties.segments[0].distance;
      console.log(`[Test Alternate] Checking alternative with distance: ${distance}m`);
      
      if (distance <= mainDistance * 1.4) {
        suitableAlternative = route;
        break;
      }
    }

    if (suitableAlternative) {
      const properties = suitableAlternative.properties.segments[0];
      console.log(`[Test Alternate] Selected alternative with distance: ${properties.distance}m`);
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

    console.warn(`[Test Alternate] No suitable alternative found within ${mainDistance * 1.4}m distance limit`);
    return {
      isSuccess: false,
      message: "No suitable alternative route found"
    };
  } catch (error) {
    console.error("[Test Alternate] Error processing request:", error);
    return {
      isSuccess: false,
      message: "Failed to calculate route"
    };
  }
} 