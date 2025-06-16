"use server"

import { ActionState } from "@/types"
import { PoiResponse } from "@/types/poi-types"
import { OsrmRoute as OrsRoute } from "@/types/meet-me-halfway-types"
import { rateLimit } from "@/lib/rate-limit"
import { Redis } from '@upstash/redis'
import { z } from 'zod';
import {
  AddressSchema,
  PoiSearchSchema,
  RouteCoordinatesSchema,
} from '@/lib/schemas';
import { formatZodError } from '@/lib/utils';
import {
  ORS_API_BASE,
  ORS_API_KEY_ENV_VAR,
  OVERPASS_API_URL,
  LOCATIONIQ_API_BASE,
  NOMINATIM_API_BASE,
  CACHE_TTL_SECONDS,
  DEFAULT_POI_RADIUS,
  DEFAULT_USER_AGENT,
} from '@/lib/constants'; // Import constants
import { auth } from "@clerk/nextjs/server"; // <-- Add Clerk auth import
// TEMPORARILY DISABLED: import { trackApiEvent } from '../app/lib/monitoring'; 
// TEMPORARILY DISABLED: import { osrmRoute } from "@/actions/osrm-actions"

// Temporary stub functions to prevent build errors
const trackApiEvent = async (event: any) => {
  console.log('[DISABLED] trackApiEvent called with:', event);
};

const osrmRoute = async (...args: any[]): Promise<any> => {
  console.log('[DISABLED] osrmRoute called with:', args);
  return { routes: [] }; // Return empty routes instead of throwing
};

// Initialize Redis client for caching
const redisCache = Redis.fromEnv();

// Remove the old in-memory cache object
// const apiCache: Record<string, { data: any, timestamp: number }> = {};
// const CACHE_TTL_SECONDS = 24 * 60 * 60; // Moved to constants.ts

// Helper function to enforce rate limiting with retry logic (Redis caching removed for performance)
export async function rateLimitedFetch(
  url: string,
  options?: RequestInit,
  maxRetries = 3,
  cacheKey?: string, // Keep parameter for backward compatibility
  timeoutMs = 30000,
  initialBackoffMs = 1000
): Promise<Response> {
  // Note: Redis caching removed to improve performance
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < maxRetries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Check rate limit before making request
      const rateLimitResult = await rateLimit({ type: 'authenticated' });
      if (!rateLimitResult.success) {
        clearTimeout(timeoutId);
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      // Make the request with AbortSignal
      const mergedOptions = {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': DEFAULT_USER_AGENT,
          'Accept-Language': 'en-US,en;q=0.9',
          ...(options?.headers || {}),
        }
      };
      
      const response = await fetch(url, mergedOptions);
      clearTimeout(timeoutId);
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new Error(`Request timed out after ${timeoutMs}ms`);
        break; 
      } else {
        lastError = error as Error;
        retries++;
        if (retries < maxRetries) {
          const delay = Math.pow(2, retries - 1) * initialBackoffMs;
          console.log(`[Fetch] Retrying (${retries}/${maxRetries}) after ${delay}ms error: ${lastError.message}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }

  console.error(`[Fetch] Failed after ${maxRetries} retries for ${url}: ${lastError?.message}`);
  throw lastError || new Error('Failed to fetch after retries');
}

interface GeocodingResult {
  lat: string
  lon: string
  display_name: string
}

// Add this after the geocodeLocationAction function
async function fallbackGeocodeAction(
  address: string
): Promise<ActionState<GeocodingResult>> {
  try {
    console.log('Using fallback geocoding service (Nominatim)');
    // Use Nominatim base URL from constants
    const url = `${NOMINATIM_API_BASE}/search?q=${encodeURIComponent(address)}&format=json&limit=1`;

    // Use User-Agent from constants
    const response = await fetch(url, {
      headers: {
        'User-Agent': DEFAULT_USER_AGENT,
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read error body');
      // Log the detailed error before throwing
      console.error(`[Fallback Geocode] Nominatim API Error ${response.status} (${response.statusText}): ${errorText}`);
      // Throw a generic error for the user, but log the specific one
      throw new Error(`Nominatim API error: ${response.statusText}`); 
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      return {
        isSuccess: false,
        message: "No results found for the provided address"
      };
    }

    return {
      isSuccess: true,
      message: "Location geocoded successfully (fallback)",
      data: {
        lat: data[0].lat,
        lon: data[0].lon,
        display_name: data[0].display_name
      }
    };
  } catch (error) {
    console.error("Error with fallback geocoding:", error);
    return { isSuccess: false, message: "Failed to geocode location with fallback service" };
  }
}

// TEMPORARY TEST - Minimal geocoding function to isolate the 500 error
export async function geocodeLocationAction(
  address: string
): Promise<ActionState<GeocodingResult>> {
  console.log('[GEOCODING] Starting test geocoding for address:', address);
  
  try {
    console.log('[GEOCODING] Test mode - returning mock data');
    return {
      isSuccess: true,
      message: "Test geocoding successful",
      data: {
        lat: "40.7128",
        lon: "-74.0060",
        display_name: "Test Location: " + address
      }
    };
  } catch (error) {
    console.error("[GEOCODING] Error in test geocoding:", error);
    if (error instanceof Error) {
      console.error("[GEOCODING] Error name:", error.name);
      console.error("[GEOCODING] Error message:", error.message); 
      console.error("[GEOCODING] Error stack:", error.stack);
    }
    return { isSuccess: false, message: "Test geocoding failed" };
  }
}

// Add this new function to search POIs using Overpass API
export async function searchPoisAction(
  // Combine parameters into an object for easier validation
  params: {
    lat: string;
    lon: string;
    radius?: number;
    types?: string[];
  }
): Promise<ActionState<PoiResponse[]>> {
  const startTime = Date.now();
  const { userId } = auth();
  let result: ActionState<PoiResponse[]> | null = null;
  let errorMsg: string | undefined = undefined;
  // --> Variables to capture success data
  let capturedPoiCount: number | undefined = undefined;
  const inputRadius = params.radius ?? DEFAULT_POI_RADIUS; // Capture input radius

  try {
    // --- Validation Start ---
    const paramsWithDefaults = {
      ...params,
      radius: params.radius ?? DEFAULT_POI_RADIUS,
    };
    const validationResult = PoiSearchSchema.safeParse(paramsWithDefaults);

    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      console.error("Validation failed for searchPoisAction:", errorMessage);
      errorMsg = `Invalid input: ${errorMessage}`;
      result = { isSuccess: false, message: errorMsg };
      return result;
    }
    const { lat, lon, radius, types } = validationResult.data;
    // --- Validation End ---

    console.log(`[POI Search] Starting search at ${lat},${lon} with radius ${radius}m`);
    const overpassApiUrl = OVERPASS_API_URL;

    // --- Build Overpass Query ---
    const amenityTypes = ["restaurant", "cafe", "bar", "library", "cinema", "theatre", "marketplace", "fast_food", "pub", "community_centre", "police", "post_office", "townhall", "ice_cream"];
    const leisureTypes = ["park", "garden", "playground", "sports_centre", "pitch", "track"]; // Added pitch, track
    const tourismTypes = ["museum", "hotel", "gallery", "attraction", "viewpoint", "picnic_site"]; // Added picnic_site
    const shopTypes = ["supermarket", "mall", "department_store", "bakery", "convenience", "books", "clothes", "gift"]; // Added clothes, gift

    const query = `
        [out:json][timeout:60];
        (
          node["amenity"~"${amenityTypes.join("|")}"](around:${radius},${lat},${lon});
          way["amenity"~"${amenityTypes.join("|")}"](around:${radius},${lat},${lon});
          relation["amenity"~"${amenityTypes.join("|")}"](around:${radius},${lat},${lon});

          node["leisure"~"${leisureTypes.join("|")}"](around:${radius},${lat},${lon});
          way["leisure"~"${leisureTypes.join("|")}"](around:${radius},${lat},${lon});
          relation["leisure"~"${leisureTypes.join("|")}"](around:${radius},${lat},${lon});

          node["tourism"~"${tourismTypes.join("|")}"](around:${radius},${lat},${lon});
          way["tourism"~"${tourismTypes.join("|")}"](around:${radius},${lat},${lon});
          relation["tourism"~"${tourismTypes.join("|")}"](around:${radius},${lat},${lon});

          node["shop"~"${shopTypes.join("|")}"](around:${radius},${lat},${lon});
          way["shop"~"${shopTypes.join("|")}"](around:${radius},${lat},${lon});
          relation["shop"~"${shopTypes.join("|")}"](around:${radius},${lat},${lon});
        );
        out center;
      `;
    // --- End Overpass Query ---

    // --- Main Logic Try Block Starts Here ---
    try {
      console.log(`[POI Search] Overpass Query Body: ${query.substring(0, 100)}...`);

      const poiCacheKey = `poi_${lat}_${lon}_${radius}`;
      const overpassTimeoutMs = 45000;

      const response = await rateLimitedFetch(
        overpassApiUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`,
        },
        3, poiCacheKey, overpassTimeoutMs
      );

      if (!response.ok) {
        let errorDetail = await response.text();
        try {
          // Try parsing as JSON in case Overpass returns structured errors
          const errorJson = JSON.parse(errorDetail);
          errorDetail = JSON.stringify(errorJson, null, 2); 
        } catch { 
          // Ignore if not JSON, keep original text
        }

        let userMessage = `Overpass API error: ${response.statusText}`;
        let logMessage = `[POI Search] Overpass API Error ${response.status} (${response.statusText}): ${errorDetail}`;

        switch (response.status) {
          case 400:
            userMessage = "Overpass API Error: Invalid query constructed.";
            logMessage = `[POI Search] Overpass API Error 400 (Bad Request): Potentially invalid query syntax. Detail: ${errorDetail}`;
            break;
          case 429:
            userMessage = "Overpass API Error: Too many requests. Please try again later.";
            logMessage = `[POI Search] Overpass API Error 429 (Too Many Requests). Detail: ${errorDetail}`;
            // Note: Our internal rate limiter should ideally catch this first.
            break;
          case 504:
            userMessage = "Overpass API Error: The server timed out. Please try again later.";
            logMessage = `[POI Search] Overpass API Error 504 (Gateway Timeout). Detail: ${errorDetail}`;
            break;
        }
        
        console.error(logMessage);
        // Use the more specific userMessage if available
        throw new Error(userMessage); 
      }

      const data = await response.json();
      
      // Create a Set to track unique POIs by their coordinates
      const uniquePois = new Set<string>();
      
      // Process POIs with relaxed filtering and deduplication
      const pois = data.elements
        .filter((poi: any) => {
          const lat = poi.lat || poi.center?.lat;
          const lon = poi.lon || poi.center?.lon;
          const hasValidCoords = lat && lon;
          
          // Create a unique key for this POI
          const poiKey = `${lat},${lon}`;
          const isUnique = !uniquePois.has(poiKey);
          
          if (isUnique) {
            uniquePois.add(poiKey);
          }
          
          return hasValidCoords && isUnique;
        })
        .map((poi: any) => {
          const poiLat = poi.lat || poi.center?.lat || 0;
          const poiLon = poi.lon || poi.center?.lon || 0;
          
          // Determine the type from tags
          const poiType = 
            poi.tags?.amenity || 
            poi.tags?.leisure || 
            poi.tags?.tourism || 
            poi.tags?.shop || 
            'place';
          
          return {
            id: poi.id.toString(),
            osm_id: poi.id.toString(),
            name: poi.tags?.name || poi.tags?.['addr:housename'] || 'Unnamed Location',
            type: poiType,
            lat: poiLat.toString(),
            lon: poiLon.toString(),
            address: {
              street: poi.tags?.['addr:street'] || '',
              city: poi.tags?.['addr:city'] || '',
              state: poi.tags?.['addr:state'] || '',
              country: poi.tags?.['addr:country'] || '',
              postal_code: poi.tags?.['addr:postcode'] || ''
            },
            tags: poi.tags
          };
        });
      
      console.log(`[POI Search] Found ${pois.length} unique POIs near ${lat},${lon}`);
      
      // Calculate distances and sort by closest to the specified point
      const sortedPois = pois
        .sort((a: PoiResponse, b: PoiResponse) => {
          // Prioritize named locations
          if (a.name !== 'Unnamed Location' && b.name === 'Unnamed Location') return -1;
          if (a.name === 'Unnamed Location' && b.name !== 'Unnamed Location') return 1;
          
          // Then sort by distance
          const distanceA = calculateDistance(parseFloat(lat), parseFloat(lon), parseFloat(a.lat), parseFloat(a.lon));
          const distanceB = calculateDistance(parseFloat(lat), parseFloat(lon), parseFloat(b.lat), parseFloat(b.lon));
          return distanceA - distanceB;
        })
        .slice(0, 20); // Increase limit to 20 POIs
      
      console.log(`[POI Search] Returning ${sortedPois.length} sorted POIs:`, {
        types: sortedPois.reduce((acc: any, poi: PoiResponse) => {
          acc[poi.type] = (acc[poi.type] || 0) + 1;
          return acc;
        }, {})
      });
      
      // ---> Capture success data here
      capturedPoiCount = sortedPois.length;
      result = {
        isSuccess: true,
        message: "Successfully found points of interest",
        data: sortedPois
      };
      return result;

    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error("[POI Search] Search timed out after 30 seconds");
        errorMsg = "POI search timed out after 30 seconds";
        result = { isSuccess: false, message: errorMsg, data: undefined };
        return result;
      }
      
      console.error("[POI Search] Error:", error);
      errorMsg = error instanceof Error ? error.message : "Failed to search for points of interest";
      result = { isSuccess: false, message: errorMsg, data: undefined };
      return result;
    }
    // --- Main Logic Try Block Ends Here ---

  } catch (outerError) { // Catch outer errors (e.g., validation - though already handled)
    console.error("Outer error in searchPoisAction:", outerError);
    errorMsg = outerError instanceof Error ? outerError.message : "Unexpected error in POI search";
    // Ensure result is set if not already
    if (!result) {
      result = { isSuccess: false, message: errorMsg };
    }
    return result;
  } finally {
    const duration = Date.now() - startTime;
    await trackApiEvent({
      endpoint: 'searchPoisAction',
      method: 'ACTION',
      status: result?.isSuccess ? 200 : (result?.message?.includes('timed out') ? 504 : (result?.message?.includes('Invalid input') ? 400 : 500)),
      duration: duration,
      error: result?.isSuccess ? undefined : (result?.message || errorMsg || 'Unknown POI search error'),
      userId: userId ?? 'anonymous',
      // ---> Use captured variables
      poiCount: capturedPoiCount,
      radius: inputRadius
    });
  }
}

// Helper function to calculate viewbox for LocationIQ search
function calculateViewbox(lat: string, lon: string, radiusKm: number): string {
  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);
  
  // Convert radius from km to degrees (approximately)
  // 1 degree of latitude = 111 km
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos(latNum * Math.PI / 180));
  
  const minLon = lonNum - lonDelta;
  const minLat = latNum - latDelta;
  const maxLon = lonNum + lonDelta;
  const maxLat = latNum + latDelta;
  
  return `${minLon},${minLat},${maxLon},${maxLat}`;
}

// Helper function to parse ORS Directions GeoJSON response
function parseOrsRouteResponse(feature: any): OrsRoute | null {
  if (!feature?.properties?.summary?.distance || 
      !feature?.properties?.summary?.duration || 
      !feature?.geometry?.coordinates) {
    console.error("[ORS Parse] Invalid route feature structure:", feature);
    return null;
  }
  return {
    distance: feature.properties.summary.distance, // meters
    duration: feature.properties.summary.duration, // seconds
    geometry: feature.geometry // GeoJSON geometry object
  };
}

export async function getRouteAction(
  params: {
    startLat: string;
    startLon: string;
    endLat: string;
    endLon: string;
  }
): Promise<ActionState<OrsRoute>> {
  const startTime = Date.now();
  const { userId } = auth();
  let result: ActionState<OrsRoute> | null = null;
  let errorMsg: string | undefined = undefined;
  let status = 500; // Default status
  let capturedRouteDistance: number | undefined = undefined;
  let capturedRouteDuration: number | undefined = undefined;
  let capturedUsedFallback: boolean = false;
  let serviceUsed = "OpenRouteService"          // NEW

  try {
    // --- Validation Start ---
    const validationResult = RouteCoordinatesSchema.safeParse(params);
    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      console.error("Validation failed for getRouteAction:", errorMessage);
      errorMsg = `Invalid input: ${errorMessage}`;
      status = 400;
      result = { isSuccess: false, message: errorMsg };
      return result;
    }
    const { startLat, startLon, endLat, endLon } = validationResult.data;
    // --- Validation End ---

    console.log(`[ORS Route] Calculating route from (${startLat},${startLon}) to (${endLat},${endLon})`);

    const apiKey = process.env[ORS_API_KEY_ENV_VAR];
    if (!apiKey) {
      console.error('[ORS Route] ORS API key is missing');
      errorMsg = "OpenRouteService API key is not configured";
      status = 500;
      result = { isSuccess: false, message: errorMsg };
      return result;
    }

    /* ── Try Fast-Routing (OSRM) first ───────────────────── */
    try {
      const osrmData = await osrmRoute({
        startLon,
        startLat,
        endLon,
        endLat,
        alts: 0,
      })
      if (osrmData.routes?.length) {
        const r = osrmData.routes[0]
        const parsed: OrsRoute = {
          distance: r.distance,
          duration: r.duration,
          geometry: r.geometry,
        }
        capturedRouteDistance = parsed.distance
        capturedRouteDuration = parsed.duration
        serviceUsed = "FastRoutingOSRM"          // NEW
        return (result = {
          isSuccess: true,
          message: "Route calculated successfully via OSRM",
          data: parsed,
        })
      }
    } catch (e) {
      console.warn("[OSRM Route] fell back to ORS →", e)
      // fall through to current ORS branch
    }

    /* ── Existing ORS logic (unchanged) ── */
    // --- Use POST Request for ORS Directions ---
    const url = `${ORS_API_BASE}/v2/directions/driving-car/geojson`; // Endpoint URL
    const requestBody = {
      coordinates: [
        [parseFloat(startLon), parseFloat(startLat)], // ORS expects [lon, lat]
        [parseFloat(endLon), parseFloat(endLat)]
      ],
      instructions: false,
      // Add other parameters if needed, e.g., preference: 'fastest'
    };
    console.log('[ORS Route] Requesting route from ORS (POST):', url);
    // console.log('[ORS Route] Request Body:', JSON.stringify(requestBody)); // Avoid logging unless needed

    const routeCacheKey = `ors_route_${startLat}_${startLon}_${endLat}_${endLon}`;
    const orsTimeoutMs = 30000;

    try {
      // Use POST method and Authorization header
      const response = await fetch(url, {
        method: 'POST', 
        headers: {
          'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
          'Content-Type': 'application/json',
          'Authorization': apiKey, // API key in header
          'User-Agent': DEFAULT_USER_AGENT,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(orsTimeoutMs) // Use built-in timeout
      });

      status = response.status; // Capture actual API status
      console.log('[ORS Route] ORS API response status:', status);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Could not read error body');
        let orsErrorMessage = `ORS Directions API error: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorBody);
          // Try to extract message from ORS error structure
          orsErrorMessage = errorJson?.error?.message || orsErrorMessage;
        } catch { /* Ignore JSON parsing error */ }

        console.warn(`[ORS Route] ORS API error ${status} (${orsErrorMessage}). Using fallback. Body: ${errorBody}`);
        errorMsg = `ORS API error ${status}. Using fallback.`;
        result = createFallbackRoute(startLat, startLon, endLat, endLon);
        capturedUsedFallback = true;
        status = 200; // Fallback is considered success
        return result;
      }

      const data = await response.json(); // Expecting GeoJSON
      // console.log('[ORS Route] ORS response:', data);

      if (!data || !data.features || data.features.length === 0) {
        console.error('[ORS Route] No route features found in ORS response');
        errorMsg = "No route found between the provided locations";
        status = 404; // Not found
        result = { isSuccess: false, message: errorMsg };
        return result;
      }

      const parsedRoute = parseOrsRouteResponse(data.features[0]);

      if (!parsedRoute) {
        console.error('[ORS Route] Failed to parse main route data from ORS response');
        errorMsg = "Route data from ORS is incomplete or invalid";
        status = 500;
        result = { isSuccess: false, message: errorMsg };
        return result;
      }

      capturedRouteDistance = parsedRoute.distance;
      capturedRouteDuration = parsedRoute.duration;
      result = {
        isSuccess: true as const,
        message: "Route calculated successfully via ORS",
        data: parsedRoute
      };

      console.log('[ORS Route] Returning calculated route:', result.data.distance, result.data.duration);
      status = 200;
      return result;

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        errorMsg = `ORS Directions request timed out after ${orsTimeoutMs}ms. Using fallback.`;
        status = 504; // Gateway Timeout
        console.error(`[ORS Route] ${errorMsg}`);
        result = createFallbackRoute(startLat, startLon, endLat, endLon);
        capturedUsedFallback = true;
        status = 200; // Fallback success
        return result;
      }

      console.error("[ORS Route] Fetch/Processing Error:", error);
      errorMsg = error instanceof Error ? error.message : "Failed to fetch route from ORS";
      status = 500; // General fetch/processing error
      console.warn(`[ORS Route] Error (${errorMsg}). Using fallback.`);
      result = createFallbackRoute(startLat, startLon, endLat, endLon);
      capturedUsedFallback = true;
      status = 200; // Fallback success
      return result;
    }

  } catch (outerError) {
    console.error("Outer error in getRouteAction:", outerError);
    if (!result) {
      result = { isSuccess: false, message: errorMsg || "Unexpected error getting ORS route" };
    }
    return result;
  } finally {
    const duration = Date.now() - startTime;
    const finalDistance = result?.isSuccess ? result.data?.distance : capturedRouteDistance;
    const finalDuration = result?.isSuccess ? result.data?.duration : capturedRouteDuration;
    await trackApiEvent({
      endpoint: 'getRouteAction',
      method: 'ACTION',
      status: result?.isSuccess ? status : (status === 200 ? 500 : status),
      duration: duration,
      error: result?.isSuccess ? undefined : (result?.message || errorMsg || 'Unknown ORS route action error'),
      userId: userId ?? 'anonymous',
      routeDistance: finalDistance,
      routeDuration: finalDuration,
      usedFallback: capturedUsedFallback || (result?.isSuccess === false && !!result?.message?.includes('fallback')),
      serviceUsed,                              // CHANGED
    });
  }
}

// Modified getMidpoint to be more robust for GeoJSON structure
function getMidpoint(route: OrsRoute): { lat: number; lng: number } | null {
  // Use route directly which is now OrsRoute type
  if (!route || !route.geometry || !route.geometry.coordinates || !route.distance) {
      console.warn('[getMidpoint] Invalid route object passed:', route);
      return null;
  }

  const coordinates = route.geometry.coordinates; // Already [lon, lat] pairs
  const totalDistance = route.distance; // meters

  if (coordinates.length < 2) {
    console.warn('[getMidpoint] Route has less than 2 coordinates.');
    return null;
  };

  let cumulativeDistance = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const point1 = coordinates[i];
    const point2 = coordinates[i + 1];

    // Validate points
    if (!Array.isArray(point1) || point1.length < 2 || typeof point1[0] !== 'number' || typeof point1[1] !== 'number' ||
        !Array.isArray(point2) || point2.length < 2 || typeof point2[0] !== 'number' || typeof point2[1] !== 'number') {
      console.warn('[getMidpoint] Invalid coordinate points in segment:', point1, point2);
      continue; // Skip invalid segment
    }

    const lon1 = point1[0];
    const lat1 = point1[1];
    const lon2 = point2[0];
    const lat2 = point2[1];

    const segmentDistance = calculateDistance(lat1, lon1, lat2, lon2); // calculateDistance expects (lat1, lon1, lat2, lon2)

    if (cumulativeDistance + segmentDistance >= totalDistance / 2) {
      const ratio = segmentDistance === 0 ? 0 : (totalDistance / 2 - cumulativeDistance) / segmentDistance;
      if (isNaN(ratio) || !isFinite(ratio)) {
         console.warn('[getMidpoint] Invalid ratio calculation, using segment start.', { totalDistance, cumulativeDistance, segmentDistance });
         return { lat: lat1, lng: lon1 };
      }
      const midLon = lon1 + ratio * (lon2 - lon1);
      const midLat = lat1 + ratio * (lat2 - lat1);

      if (isNaN(midLat) || isNaN(midLon)) {
         console.warn('[getMidpoint] Calculated midpoint coordinates are NaN.');
         return { lat: lat1, lng: lon1 }; // Fallback to segment start
      }
      return { lat: midLat, lng: lon1 }; // Return { lat, lng }
    }
    cumulativeDistance += segmentDistance;
  }

  // Fallback
  console.warn('[getMidpoint] Midpoint not found along segments, returning last point.');
  const lastPoint = coordinates[coordinates.length - 1];
  if (Array.isArray(lastPoint) && lastPoint.length >= 2 && typeof lastPoint[0] === 'number' && typeof lastPoint[1] === 'number') {
      return { lat: lastPoint[1], lng: lastPoint[0] };
  }

  return null;
}

export async function calculateMidpointAction(
  // Combine parameters
  params: {
    startLat: string;
    startLon: string;
    endLat: string;
    endLon: string;
  }
): Promise<ActionState<{ lat: string; lon: string }>> {
  const startTime = Date.now();
  const { userId } = auth();
  let result: ActionState<{ lat: string; lon: string }> | null = null;
  let errorMsg: string | undefined = undefined;
  let status = 500; // Default status

  try {
    // --- Validation Start ---
    const validationResult = RouteCoordinatesSchema.safeParse(params);
    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      console.error("Validation failed for calculateMidpointAction:", errorMessage);
      errorMsg = `Invalid input: ${errorMessage}`;
      status = 400;
      result = { isSuccess: false, message: errorMsg };
      return result;
    }
    const { startLat, startLon, endLat, endLon } = validationResult.data;
    // --- Validation End ---

    console.log(`[Midpoint Calc] Calculating midpoint between (${startLat}, ${startLon}) and (${endLat}, ${endLon})`);
    try {
      // Get the route first
      const routeResult = await getRouteAction({ startLat, startLon, endLat, endLon })
      
      if (!routeResult.isSuccess) {
        return {
          isSuccess: false,
          message: routeResult.message
        }
      }
      
      const route = routeResult.data
      
      // Extract the coordinates from the route
      const coordinates = route.geometry.coordinates
      
      if (!coordinates || coordinates.length < 2) {
        return {
          isSuccess: false,
          message: "Route has insufficient points for midpoint calculation"
        }
      }
      
      // Calculate the total distance of the route
      let totalDistance = 0
      const distances = []
      
      for (let i = 1; i < coordinates.length; i++) {
        const segmentDistance = calculateDistance(
          coordinates[i-1][1], coordinates[i-1][0], 
          coordinates[i][1], coordinates[i][0]
        )
        distances.push(segmentDistance)
        totalDistance += segmentDistance
      }
      
      // Find the midpoint (50% of the total distance)
      const halfDistance = totalDistance / 2
      let distanceCovered = 0
      let midpointIndex = 0
      
      for (let i = 0; i < distances.length; i++) {
        distanceCovered += distances[i]
        if (distanceCovered >= halfDistance) {
          midpointIndex = i
          break
        }
      }
      
      // Calculate the exact midpoint using linear interpolation
      const segmentStart = coordinates[midpointIndex]
      const segmentEnd = coordinates[midpointIndex + 1]
      
      // Calculate how far along the segment the midpoint is
      const distanceBeforeSegment = distanceCovered - distances[midpointIndex]
      const segmentFraction = (halfDistance - distanceBeforeSegment) / distances[midpointIndex]
      
      // Interpolate the coordinates
      const midpointLon = segmentStart[0] + segmentFraction * (segmentEnd[0] - segmentStart[0])
      const midpointLat = segmentStart[1] + segmentFraction * (segmentEnd[1] - segmentStart[1])
      
      return {
        isSuccess: true,
        message: "Midpoint calculated successfully",
        data: {
          lat: midpointLat.toString(),
          lon: midpointLon.toString()
        }
      }
    } catch (error) {
      console.error("Error calculating midpoint:", error)
      return { isSuccess: false, message: "Failed to calculate midpoint" }
    }
  } catch (outerError) {
    console.error("Outer error in calculateMidpointAction:", outerError);
    // errorMsg and status should be set by validation
    if (!result) {
      result = { isSuccess: false, message: errorMsg || "Unexpected error calculating midpoint" };
    }
    return result;
  } finally {
    const duration = Date.now() - startTime;
    await trackApiEvent({
      endpoint: 'calculateMidpointAction',
      method: 'ACTION',
      status: result?.isSuccess ? status : (status !== 500 ? status : (result?.message?.includes('Invalid input') ? 400 : 500)),
      duration: duration,
      error: result?.isSuccess ? undefined : (result?.message || errorMsg || 'Unknown midpoint calculation error'),
      userId: userId ?? 'anonymous',
    });
  }
}

// Moved calculateDistance higher up
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c // Distance in meters
}

// The updated getAlternateRouteAction function (from previous step)
export async function getAlternateRouteAction(
  // Combine parameters
  params: {
    startLat: string;
    startLon: string;
    endLat: string;
    endLon: string;
  }
): Promise<ActionState<OrsRoute>> {
  const startTime = Date.now();
  const { userId } = auth();
  let result: ActionState<OrsRoute> | null = null;
  let errorMsg: string | undefined = undefined;
  let status = 500; // Default status
  let capturedRouteDistance: number | undefined = undefined;
  let capturedRouteDuration: number | undefined = undefined;
  let capturedUsedFallback: boolean = false;
  let serviceUsed = "OpenRouteService"          // NEW

  try {
    // --- Validation Start ---
    const validationResult = RouteCoordinatesSchema.safeParse(params);
    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      console.error("Validation failed for getAlternateRouteAction:", errorMessage);
      errorMsg = `Invalid input: ${errorMessage}`;
      status = 400;
      result = { isSuccess: false, message: errorMsg };
      return result;
    }
    const { startLat, startLon, endLat, endLon } = validationResult.data;
    // --- Validation End ---

    console.log(`[ORS Alt Route] Requesting alternate routes from (${startLat}, ${startLon}) to (${endLat}, ${endLon})`);

    const apiKey = process.env[ORS_API_KEY_ENV_VAR];
    if (!apiKey) {
      console.error('[ORS Alt Route] ORS API key is missing');
      errorMsg = "OpenRouteService API key is not configured";
      status = 500;
      result = { isSuccess: false, message: errorMsg };
      return result;
    }

    /* ── OSRM attempt (up to 3 alts) ─────────────────────── */
    try {
      const osrmData = await osrmRoute({
        startLon,
        startLat,
        endLon,
        endLat,
        alts: 3,
      })
      if (osrmData.routes?.length > 1) {
        const main = osrmData.routes[0]
        const alts = osrmData.routes.slice(1)

        // pick first alt ≤ 40 % longer than main
        const chosen = alts.find((r: any) => r.distance <= main.distance * 1.4)
        if (chosen) {
          const parsed: OrsRoute = {
            distance: chosen.distance,
            duration: chosen.duration,
            geometry: chosen.geometry,
          }
          capturedRouteDistance = parsed.distance
          capturedRouteDuration = parsed.duration
          serviceUsed = "FastRoutingOSRM"        // NEW
          return (result = {
            isSuccess: true,
            message: "Alternate route calculated via OSRM",
            data: parsed,
          })
        }
      }
      console.log("[OSRM Alt] no suitable alt, falling back to ORS")
    } catch (e) {
      console.warn("[OSRM Alt] fell back to ORS →", e)
    }

    /* ── Existing ORS alternate-route code unchanged ── */
    // --- Use POST Request for ORS Directions ---
    const url = `${ORS_API_BASE}/v2/directions/driving-car/geojson`; // Endpoint URL
    const requestBody = {
      coordinates: [
        [parseFloat(startLon), parseFloat(startLat)],
        [parseFloat(endLon), parseFloat(endLat)]
      ],
      alternative_routes: { // Request alternatives via body parameter
        target_count: 3, // Request up to 3 alternatives (including main)
        // Optional: add weight_factor or share_factor if needed
      },
      instructions: false,
    };
    console.log('[ORS Alt Route] Requesting routes from ORS (POST):', url);
    // console.log('[ORS Alt Route] Request Body:', JSON.stringify(requestBody));

    const altRouteCacheKey = `ors_alt_route_${startLat}_${startLon}_${endLat}_${endLon}`;
    const orsTimeoutMs = 30000;

    try {
      // Use POST method and Authorization header
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
          'Content-Type': 'application/json',
          'Authorization': apiKey,
          'User-Agent': DEFAULT_USER_AGENT,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(orsTimeoutMs)
      });
      
      status = response.status;
      console.log('[ORS Alt Route] ORS API response status:', status);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Could not read error body');
        let orsErrorMessage = `ORS Directions API error: ${response.statusText}`;
         try {
          const errorJson = JSON.parse(errorBody);
           orsErrorMessage = errorJson?.error?.message || orsErrorMessage;
         } catch { /* Ignore */ }

        console.warn(`[ORS Alt Route] ORS API error ${status} (${orsErrorMessage}). Using fallback. Body: ${errorBody}`);
        errorMsg = `ORS API error ${status}. Using fallback.`;
        result = createFallbackRoute(startLat, startLon, endLat, endLon);
        capturedUsedFallback = true;
        status = 200; // Fallback success
        return result;
      }

      const data = await response.json(); 
      if (!data || !data.features || data.features.length === 0) {
        console.warn(`[ORS Alt Route] ORS returned no routes. Using fallback.`);
        errorMsg = "ORS returned no routes. Using fallback.";
        result = createFallbackRoute(startLat, startLon, endLat, endLon);
        capturedUsedFallback = true;
        status = 200; // Fallback success
        return result;
      }

      // Parse all route features
      const allParsedRoutes = data.features.map(parseOrsRouteResponse).filter((r: OrsRoute | null): r is OrsRoute => r !== null);

      if (allParsedRoutes.length === 0) {
         console.warn(`[ORS Alt Route] Failed to parse any routes from ORS response. Using fallback.`);
        errorMsg = "Failed to parse route data from ORS. Using fallback.";
        result = createFallbackRoute(startLat, startLon, endLat, endLon);
        capturedUsedFallback = true;
        status = 200; // Fallback success
        return result;
      }

      const mainRoute = allParsedRoutes[0];
      const potentialAlternatives = allParsedRoutes.slice(1);

      const reasonableAlternatives = potentialAlternatives.filter((route: OrsRoute) =>
        route.distance <= mainRoute.distance * 1.4 &&
        route.duration <= mainRoute.duration * 1.5
      );

      let selectedAlternative: OrsRoute | null = null;

      if (reasonableAlternatives.length === 0) {
        console.log("[ORS Alt Route] No reasonable alternatives found. Using fallback.");
        errorMsg = "No reasonable alternatives found. Using fallback.";
        result = createFallbackRoute(startLat, startLon, endLat, endLon);
        capturedUsedFallback = true;
        status = 200; // Fallback success
        return result;
      } else if (reasonableAlternatives.length === 1) {
        console.log("[ORS Alt Route] One reasonable alternative found.");
        selectedAlternative = reasonableAlternatives[0];
      } else {
         console.log("[ORS Alt Route] Multiple reasonable alternatives found. Selecting the most geographically different.");
        const mainMidpoint = getMidpoint(mainRoute);
        if (!mainMidpoint) {
           console.warn("[ORS Alt Route] Could not calculate main route midpoint. Selecting first reasonable alternative.");
           selectedAlternative = reasonableAlternatives[0];
        } else {
          let maxMidpointDistance = -1;
          reasonableAlternatives.forEach((alt: OrsRoute) => {
            const altMidpoint = getMidpoint(alt);
            if (altMidpoint) {
              const distance = calculateDistance(mainMidpoint.lat, mainMidpoint.lng, altMidpoint.lat, altMidpoint.lng);
              if (distance > maxMidpointDistance) {
                maxMidpointDistance = distance;
                selectedAlternative = alt;
              }
            } else {
               console.warn("[ORS Alt Route] Could not calculate midpoint for an alternative route:", alt);
            }
          });
          if (!selectedAlternative) {
             console.warn("[ORS Alt Route] Could not determine most different alternative based on midpoints. Selecting first reasonable.");
             selectedAlternative = reasonableAlternatives[0];
          }
        }
      }

      if (selectedAlternative) {
        capturedRouteDistance = selectedAlternative.distance;
        capturedRouteDuration = selectedAlternative.duration;
        result = {
          isSuccess: true,
          message: "Alternate route calculated successfully via ORS",
          data: selectedAlternative
        };
        status = 200;
        return result;
      } else {
        console.log("[ORS Alt Route] Failed to select an alternative. Using fallback.");
        errorMsg = "Failed to select an alternative. Using fallback.";
        result = createFallbackRoute(startLat, startLon, endLat, endLon);
        capturedUsedFallback = true;
        status = 200; // Fallback success
        return result;
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        errorMsg = `ORS Directions request timed out after ${orsTimeoutMs}ms. Using fallback.`;
        status = 504;
        console.error(`[ORS Alt Route] ${errorMsg}`);
        result = createFallbackRoute(startLat, startLon, endLat, endLon);
        capturedUsedFallback = true;
        status = 200; // Fallback success
        return result;
      }

      console.error("[ORS Alt Route] Fetch/Processing Error:", error);
      errorMsg = error instanceof Error ? error.message : "Failed to fetch alternate route from ORS";
      status = 500;
      console.warn(`[ORS Alt Route] Error (${errorMsg}). Using fallback.`);
      result = createFallbackRoute(startLat, startLon, endLat, endLon);
      capturedUsedFallback = true;
      status = 200; // Fallback success
      return result;
    }

  } catch (outerError) {
    console.error("Outer error in getAlternateRouteAction:", outerError);
    if (!result) {
      result = { isSuccess: false, message: errorMsg || "Unexpected error getting ORS alternate route" };
    }
    return result;
  } finally {
    const duration = Date.now() - startTime;
    const finalDistance = result?.isSuccess ? result.data?.distance : capturedRouteDistance;
    const finalDuration = result?.isSuccess ? result.data?.duration : capturedRouteDuration;
    await trackApiEvent({
      endpoint: 'getAlternateRouteAction',
      method: 'ACTION',
      status: result?.isSuccess ? status : (status === 200 ? 500 : status),
      duration: duration,
      error: result?.isSuccess ? undefined : (result?.message || errorMsg || 'Unknown ORS alt route action error'),
      userId: userId ?? 'anonymous',
      routeDistance: finalDistance,
      routeDuration: finalDuration,
      usedFallback: capturedUsedFallback || (result?.isSuccess === false && !!result?.message?.includes('fallback')),
      serviceUsed,                              // CHANGED
    });
  }
}

// Update Fallback Route to return OrsRoute shape
function createFallbackRoute(startLat: string, startLon: string, endLat: string, endLon: string): ActionState<OrsRoute> {
  try {
    const sLat = parseFloat(startLat);
    const sLon = parseFloat(startLon);
    const eLat = parseFloat(endLat);
    const eLon = parseFloat(endLon);

    if ([sLat, sLon, eLat, eLon].some(isNaN)) {
      throw new Error("Invalid coordinates provided to fallback route creator.");
    }

    const directDistance = calculateDistance(sLat, sLon, eLat, eLon);

    // Create a simple straight line geometry
    const fallbackGeometry = {
      coordinates: [[sLon, sLat], [eLon, eLat]] as [number, number][],
      type: "LineString" as const
    };

    // Estimate duration (50 km/h = 13.89 m/s)
    const estimatedDuration = directDistance / 13.89;

    console.log(`[Fallback Route] Created fallback: dist=${directDistance.toFixed(0)}m, dur=${estimatedDuration.toFixed(0)}s`);

    return {
      isSuccess: true as const,
      message: "Route estimated (fallback)", // Keep message generic
      data: {
        distance: directDistance, // Use direct distance
        duration: estimatedDuration,
        geometry: fallbackGeometry
      }
    }
  } catch (fallbackError) {
    console.error("[Fallback Route] Error creating fallback:", fallbackError);
    return {
      isSuccess: false as const,
      message: "Failed to calculate route and fallback also failed",
      data: undefined
    }
  }
}

// Also add a function to calculate the midpoint for the alternate route
export async function calculateAlternateMidpointAction(
  // Combine parameters
  params: {
    startLat: string;
    startLon: string;
    endLat: string;
    endLon: string;
  }
): Promise<ActionState<{ lat: string; lon: string }>> {
  const startTime = Date.now();
  const { userId } = auth();
  let result: ActionState<{ lat: string; lon: string }> | null = null;
  let errorMsg: string | undefined = undefined;
  let status = 500; // Default status

  try {
    // --- Validation Start ---
    const validationResult = RouteCoordinatesSchema.safeParse(params);
    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      console.error("Validation failed for calculateAlternateMidpointAction:", errorMessage);
      errorMsg = `Invalid input: ${errorMessage}`;
      status = 400;
      result = { isSuccess: false, message: errorMsg };
      return result;
    }
    const { startLat, startLon, endLat, endLon } = validationResult.data;
    // --- Validation End ---

    console.log(`[Alt Midpoint Calc] Calculating alt midpoint between (${startLat}, ${startLon}) and (${endLat}, ${endLon})`);

    // --- Main Logic Try Block Starts Here ---
    try {
      // Get the alternate route first
      const routeResult = await getAlternateRouteAction({ startLat, startLon, endLat, endLon });

      if (!routeResult.isSuccess) {
          // Even if getAlternateRouteAction used fallback (isSuccess=true), if it failed internally before fallback, use its message.
          errorMsg = routeResult.message;
          status = 500; // Assume internal error if alt route failed fundamentally
          result = { isSuccess: false, message: errorMsg };
          return result;
      }

      const route = routeResult.data;
      const coordinates = route.geometry.coordinates;

      if (!coordinates || coordinates.length < 2) {
          errorMsg = "Alternate route has insufficient points for midpoint calculation";
          status = 400; // Bad data from alt route
          result = { isSuccess: false, message: errorMsg };
          return result;
      }

      // Calculate the total distance of the route
      let totalDistance = 0;
      const distances = [];
      for (let i = 1; i < coordinates.length; i++) {
          const segmentDistance = calculateDistance(coordinates[i-1][1], coordinates[i-1][0], coordinates[i][1], coordinates[i][0]);
          distances.push(segmentDistance);
          totalDistance += segmentDistance;
      }

      // Find the midpoint
      const halfDistance = totalDistance / 2;
      let distanceCovered = 0;
      let midpointIndex = 0;
      for (let i = 0; i < distances.length; i++) {
          distanceCovered += distances[i];
          if (distanceCovered >= halfDistance) {
              midpointIndex = i;
              break;
          }
      }

      // Interpolate the midpoint coordinates
      const segmentStart = coordinates[midpointIndex];
      const segmentEnd = coordinates[midpointIndex + 1];
      // Handle edge case
      if (!segmentEnd) {
          console.warn("[Alt Midpoint Calc] Midpoint index out of bounds, using last point.");
          result = { isSuccess: true, message: "Alternate midpoint calculated successfully (at end point)", data: { lat: segmentStart[1].toString(), lon: segmentStart[0].toString() } };
          status = 200;
          return result;
      }

      const distanceBeforeSegment = distanceCovered - distances[midpointIndex];
      const segmentFraction = distances[midpointIndex] === 0 ? 0 : (halfDistance - distanceBeforeSegment) / distances[midpointIndex];

      const midpointLon = segmentStart[0] + segmentFraction * (segmentEnd[0] - segmentStart[0]);
      const midpointLat = segmentStart[1] + segmentFraction * (segmentEnd[1] - segmentStart[1]);

      result = {
        isSuccess: true,
        message: "Alternate midpoint calculated successfully",
        data: { lat: midpointLat.toString(), lon: midpointLon.toString() }
      };
      status = 200;
      return result;

    } catch (error) { // Catch calculation errors
      errorMsg = error instanceof Error ? error.message : "Failed to calculate alternate midpoint";
      status = 500;
      console.error("Error calculating alternate midpoint:", error);
      result = { isSuccess: false, message: errorMsg };
      return result;
    }
    // --- Main Logic Try Block Ends Here ---

  } catch (outerError) { // Catch outer errors (validation)
    console.error("Outer error in calculateAlternateMidpointAction:", outerError);
    // errorMsg and status should be set by validation
    if (!result) {
      result = { isSuccess: false, message: errorMsg || "Unexpected error calculating alternate midpoint" };
    }
    return result;
  } finally {
    const duration = Date.now() - startTime;
    await trackApiEvent({
      endpoint: 'calculateAlternateMidpointAction',
      method: 'ACTION',
      status: result?.isSuccess ? status : (status !== 500 ? status : (result?.message?.includes('Invalid input') ? 400 : 500)),
      duration: duration,
      error: result?.isSuccess ? undefined : (result?.message || errorMsg || 'Unknown alternate midpoint calculation error'),
      userId: userId ?? 'anonymous',
    });
  }
} 