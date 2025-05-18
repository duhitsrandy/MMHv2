interface HereRouteParams {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
}

interface HereRouteResponse {
  duration: number; // in seconds
  length: number;   // in meters
  // We can add more fields if needed from the HERE API response
}

interface HereApiError {
  title: string;
  status: number;
  cause?: string;
  action?: string;
  correlationId?: string;
  code?: string; // Service-specific error code
}

interface HereMatrixOrigin {
  lat: number;
  lng: number;
}

interface HereMatrixDestination {
  lat: number;
  lng: number;
}

interface HereMatrixParams {
  origins: HereMatrixOrigin[];
  destinations: HereMatrixDestination[];
}

interface HereMatrixResponseData {
  matrixId: string;
  matrix: {
    numOrigins: number;
    numDestinations: number;
    travelTimes?: number[]; // Flat array
    distances?: number[];   // Flat array
    errorCodes?: number[];  // Flat array, 0 for success
  };
  regionDefinition: { type: string; /* and other fields if not world */ };
}

// This is what our hook/action will receive (processed data)
interface ProcessedHereMatrixResponse {
  travelTimes: (number | null)[][]; // null if error for that cell
  distances: (number | null)[][];   // null if error for that cell
}

/**
 * Fetches a single route with real-time traffic information from the HERE API.
 * (Existing function - might be kept for specific single route lookups if needed)
 */
export async function getRouteWithTrafficHere(
  params: HereRouteParams
): Promise<{ data: HereRouteResponse | null; error: string | null }> {
  const apiKey = process.env.HERE_API_KEY;
  if (!apiKey) {
    console.error("HERE_API_KEY is not set in environment variables.");
    return { data: null, error: "HERE API Key not configured." };
  }

  const origin = `${params.originLat},${params.originLng}`;
  const destination = `${params.destLat},${params.destLng}`;
  const hereApiUrl = `https://router.hereapi.com/v8/routes?transportMode=car&origin=${origin}&destination=${destination}&return=summary&departureTime=now&apiKey=${apiKey}`;

  try {
    const response = await fetch(hereApiUrl);
    if (!response.ok) {
      let errorBody: Partial<HereApiError> = {};
      try { errorBody = await response.json(); } catch (e) { /*ignore*/ }
      const errorMessage = `HERE API Error (Single Route): ${response.status} ${response.statusText}. ${errorBody.title || ''}`.trim();
      console.error(errorMessage, { origin, destination });
      return { data: null, error: errorMessage };
    }
    const data = await response.json();
    if (data.routes && data.routes.length > 0 && data.routes[0].sections && data.routes[0].sections.length > 0) {
      const section = data.routes[0].sections[0];
      if (section.summary) {
        return { data: { duration: section.summary.duration, length: section.summary.length }, error: null };
      }
    }
    return { data: null, error: "HERE API (Single Route): No route found or unexpected response." };
  } catch (err: any) {
    console.error(`[HERE API Single Route] Network error: ${err.message}`, { origin, destination });
    return { data: null, error: `HERE API (Single Route) request failed: ${err.message}` };
  }
}

/**
 * Fetches a travel time matrix with real-time traffic from the HERE Matrix Routing API v8.
 * Uses synchronous mode (async=false).
 * See: https://developer.here.com/documentation/matrix-routing-api/dev_guide/topics/matrix-calculation/synchronous-matrix.html
 */
export async function getTravelTimeMatrixHere(
  params: HereMatrixParams
): Promise<{ data: ProcessedHereMatrixResponse | null; error: string | null }> {
  const apiKey = process.env.HERE_API_KEY;
  if (!apiKey) {
    console.error("HERE_API_KEY is not set for Matrix API.");
    return { data: null, error: "HERE API Key not configured for Matrix API." };
  }

  const hereMatrixApiUrl = `https://matrix.router.hereapi.com/v8/matrix?apiKey=${apiKey}&async=false`;

  const requestBody = {
    origins: params.origins.map(o => ({ lat: o.lat, lng: o.lng })), // Corrected to lat/lng
    destinations: params.destinations.map(d => ({ lat: d.lat, lng: d.lng })), // Corrected to lat/lng
    regionDefinition: { type: "world" }, // For global flexible mode with traffic
    routingMode: "fast",
    transportMode: "car",
    // departureTime is omitted to default to "now" for live traffic
    matrixAttributes: ["travelTimes", "distances"] // Request errorCodes as well - REMOVED errorCodes
  };

  try {
    console.log(`[HERE Matrix API] Requesting matrix for ${params.origins.length} origins to ${params.destinations.length} destinations. Body:`, JSON.stringify(requestBody));
    const response = await fetch(hereMatrixApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text(); // Get text first for better error logging

    if (!response.ok) {
      let errorBody: Partial<HereApiError> = {};
      try { errorBody = JSON.parse(responseText); } catch (e) { /*ignore if not JSON*/ }
      const errorTitle = errorBody.title || "Unknown error";
      const errorCause = errorBody.cause || response.statusText;
      const errorMessage = `HERE Matrix API Error: ${response.status}. ${errorTitle} - ${errorCause}. Action: ${errorBody.action || 'N/A'}`.trim();
      console.error(errorMessage, { requestBody, responseBody: responseText });
      return { data: null, error: errorMessage };
    }

    const responseData: HereMatrixResponseData = JSON.parse(responseText);
    console.log("[HERE Matrix API] Raw responseData:", responseData);

    if (responseData.matrix && responseData.matrix.numOrigins !== undefined && responseData.matrix.numDestinations !== undefined) {
      const { numOrigins, numDestinations, travelTimes: flatTravelTimes, distances: flatDistances, errorCodes: flatErrorCodes } = responseData.matrix;

      if (!flatTravelTimes || !flatDistances) {
          console.warn("[HERE Matrix API] travelTimes or distances array is missing in the response matrix object.", responseData.matrix);
          return { data: null, error: "HERE Matrix API: travelTimes or distances missing in response."};
      }
      
      // Unflatten the arrays
      const travelTimes: (number | null)[][] = [];
      const distances: (number | null)[][] = [];

      for (let i = 0; i < numOrigins; i++) {
        travelTimes[i] = [];
        distances[i] = [];
        for (let j = 0; j < numDestinations; j++) {
          const k = (numDestinations * i) + j;
          const errorCode = flatErrorCodes ? flatErrorCodes[k] : 0; // Assume 0 if errorCodes not present
          
          if (errorCode === 0) {
            travelTimes[i][j] = flatTravelTimes[k] !== undefined ? flatTravelTimes[k] : null;
            distances[i][j] = flatDistances[k] !== undefined ? flatDistances[k] : null;
          } else {
            console.warn(`[HERE Matrix API] Error for cell (origin ${i}, dest ${j}): code ${errorCode}. Setting travelTime/distance to null.`);
            travelTimes[i][j] = null;
            distances[i][j] = null;
          }
        }
      }
      console.log(`[HERE Matrix API] Success. Processed matrix.`);
      return {
        data: { travelTimes, distances },
        error: null,
      };
    }
    
    console.warn("[HERE Matrix API] Response structure not as expected or matrix object missing critical fields.", responseData);
    return { data: null, error: "HERE Matrix API: Unexpected response structure or missing matrix fields." };

  } catch (err: any) {
    console.error(`[HERE Matrix API] Network or other error: ${err.message}`, { requestBody });
    return { data: null, error: `HERE Matrix API request failed: ${err.message}` };
  }
} 