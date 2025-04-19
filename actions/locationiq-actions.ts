"use server"

import { ActionState } from "@/types"
import { PoiResponse } from "@/types/poi-types"
import { OsrmRoute } from "@/types/meet-me-halfway-types"
import { rateLimit } from "@/lib/rate-limit"
import { z } from 'zod';
import {
  AddressSchema,
  PoiSearchSchema,
  RouteCoordinatesSchema,
} from '@/lib/schemas';
import { formatZodError } from '@/lib/utils';

// Simple in-memory cache
const apiCache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Helper function to enforce rate limiting with retry logic
export async function rateLimitedFetch(
  url: string,
  options?: RequestInit,
  maxRetries = 3,
  cacheKey?: string // Add optional cacheKey parameter
): Promise<Response> {
  const effectiveCacheKey = cacheKey || url; // Use custom key if provided, else URL

  // Check cache first using the effective key
  if (apiCache[effectiveCacheKey] && (Date.now() - apiCache[effectiveCacheKey].timestamp) < CACHE_TTL) {
    console.log(`[Cache] HIT for Key: ${effectiveCacheKey}`); // Log cache hit
    const cachedData = apiCache[effectiveCacheKey].data;
    return new Response(JSON.stringify(cachedData), {
      status: 200,
      statusText: 'OK (Cached)',
      headers: { 'Content-Type': 'application/json' }
    });
  }

  console.log(`[Cache] MISS for Key: ${effectiveCacheKey}`); // Log cache miss
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < maxRetries) {
    try {
      // Check rate limit before making request
      const rateLimitResult = await rateLimit({ type: 'authenticated' });
      if (!rateLimitResult.success) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      // Make the request
      // Pass through any provided fetch options (headers, method, body, etc.)
      const mergedOptions = {
        ...options, // Spread provided options
        headers: {
          'User-Agent': 'Meet-Me-Halfway/1.0',
          'Accept-Language': 'en-US,en;q=0.9',
          ...(options?.headers || {}), // Merge headers from options
        }
      };
      console.log(`[Fetch] Making request to ${url} with options:`, mergedOptions);
      const response = await fetch(url, mergedOptions);

      // Cache successful responses using the effective key
      if (response.ok) {
        try {
            const data = await response.clone().json(); // Clone before reading
            apiCache[effectiveCacheKey] = {
              data,
              timestamp: Date.now()
            };
            console.log(`[Cache] Stored response for Key: ${effectiveCacheKey}`);
        } catch (jsonError) {
            // Handle cases where response is OK but not JSON (rare for APIs we use)
            console.warn(`[Cache] Response for ${effectiveCacheKey} was OK but not valid JSON.`);
            // Decide whether to cache non-JSON or not. Currently not caching.
        }
      }

      // Return the original response object (not the clone)
      return response;
    } catch (error) {
      lastError = error as Error;
      retries++;
      if (retries < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
      }
    }
  }

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
    // Using OpenStreetMap Nominatim as a fallback
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      address
    )}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Meet-Me-Halfway/1.0',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) {
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

// Modify the geocodeLocationAction to use the fallback if LocationIQ fails
export async function geocodeLocationAction(
  address: string
): Promise<ActionState<GeocodingResult>> {
  // --- Validation Start ---
  const validationResult = AddressSchema.safeParse(address);
  if (!validationResult.success) {
    const errorMessage = formatZodError(validationResult.error);
    console.error("Validation failed for geocodeLocationAction:", errorMessage);
    return {
      isSuccess: false,
      message: `Invalid input: ${errorMessage}`,
    };
  }
  const validatedAddress = validationResult.data;
  // --- Validation End ---

  try {
    console.log('Geocoding address:', validatedAddress);
    const apiKey = process.env.LOCATIONIQ_KEY;
    if (!apiKey) {
      console.error('LocationIQ API key is missing');
      return {
        isSuccess: false,
        message: "LocationIQ API key is not configured"
      };
    }

    const url = `https://us1.locationiq.com/v1/search.php?key=${apiKey}&q=${encodeURIComponent(
      validatedAddress
    )}&format=json&limit=1`;

    try {
      const response = await rateLimitedFetch(url);
      console.log('LocationIQ API response status:', response.status);

      if (!response.ok) {
        console.warn(`LocationIQ API error: ${response.statusText}. Trying fallback.`);
        return fallbackGeocodeAction(validatedAddress);
      }

      const data = await response.json();
      console.log('LocationIQ API response:', data);

      if (!data || data.length === 0) {
        console.warn('No results from LocationIQ. Trying fallback.');
        return fallbackGeocodeAction(validatedAddress);
      }

      return {
        isSuccess: true,
        message: "Location geocoded successfully",
        data: {
          lat: data[0].lat,
          lon: data[0].lon,
          display_name: data[0].display_name
        }
      };
    } catch (error) {
      console.warn("Error with primary geocoding service:", error);
      return fallbackGeocodeAction(validatedAddress);
    }
  } catch (error) {
    console.error("Error geocoding location:", error);
    return { isSuccess: false, message: "Failed to geocode location" };
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

  // --- Validation Start ---
  // Provide default radius if not present before validation
  const paramsWithDefaults = {
    ...params,
    radius: params.radius ?? 1500, // Default radius: 1500m
  };
  const validationResult = PoiSearchSchema.safeParse(paramsWithDefaults);

  if (!validationResult.success) {
    const errorMessage = formatZodError(validationResult.error);
    console.error("Validation failed for searchPoisAction:", errorMessage);
    return {
      isSuccess: false,
      message: `Invalid input: ${errorMessage}`,
    };
  }
  const { lat, lon, radius, types } = validationResult.data;
  // --- Validation End ---

  console.log(`[POI Search] Starting search at ${lat},${lon} with radius ${radius}m`);
  const overpassApiUrl = "https://overpass-api.de/api/interpreter";

  // --- Build Overpass Query ---
  // Removed the types parameter check as the schema handles optionality
  // Keep the comprehensive query structure
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

  try {
    console.log(`[POI Search] Overpass Query Body: ${query.substring(0, 100)}...`); // Log query snippet

    // --- Use rateLimitedFetch for Overpass API call ---
    // Create a specific cache key for this POI search
    const poiCacheKey = `poi_${lat}_${lon}_${radius}`;

    const response = await rateLimitedFetch(
        overpassApiUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`,
        },
        3, // maxRetries (default)
        poiCacheKey // Provide the specific cache key
    );
    // --- End fetch modification ---

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[POI Search] Overpass API Error ${response.status}: ${errorText}`);
      throw new Error(`Overpass API error: ${response.statusText}`);
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
    
    return {
      isSuccess: true,
      message: "Successfully found points of interest",
      data: sortedPois
    };

  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error("[POI Search] Search timed out after 30 seconds");
      return {
        isSuccess: false,
        message: "POI search timed out after 30 seconds",
        data: undefined
      };
    }
    
    console.error("[POI Search] Error:", error);
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to search for points of interest",
      data: undefined
    };
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

export async function getRouteAction(
  // Combine parameters into an object
  params: {
    startLat: string;
    startLon: string;
    endLat: string;
    endLon: string;
  }
): Promise<ActionState<OsrmRoute>> {

  // --- Validation Start ---
  const validationResult = RouteCoordinatesSchema.safeParse(params);
  if (!validationResult.success) {
    const errorMessage = formatZodError(validationResult.error);
    console.error("Validation failed for getRouteAction:", errorMessage);
    return {
      isSuccess: false,
      message: `Invalid input: ${errorMessage}`,
    };
  }
  const { startLat, startLon, endLat, endLon } = validationResult.data;
  // --- Validation End ---

  console.log(`[Route Calculation] Calculating route from (${startLat},${startLon}) to (${endLat},${endLon})`);
  
  // Validate coordinates
  if (!startLat || !startLon || !endLat || !endLon) {
    console.error('[Route Calculation] Missing coordinates');
    return {
      isSuccess: false as const,
      message: "Missing coordinates for route calculation"
    }
  }
  
  // Ensure coordinates are valid numbers
  const coords = [
    parseFloat(startLat), parseFloat(startLon),
    parseFloat(endLat), parseFloat(endLon)
  ];
  
  if (coords.some(isNaN)) {
    console.error('[Route Calculation] Invalid coordinates:', coords);
    return {
      isSuccess: false as const,
      message: "Invalid coordinates for route calculation"
    }
  }
  
  // Using OSRM for routing
  const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`
  console.log('[Route Calculation] Requesting route from OSRM:', url);

  const response = await rateLimitedFetch(url)
  if (!response.ok) {
    console.warn(`[Route Calculation] OSRM API error: ${response.statusText}. Using fallback route data.`);
    
    // Return a fallback route with estimated data
    const directDistance = calculateDistance(
      parseFloat(startLat), parseFloat(startLon),
      parseFloat(endLat), parseFloat(endLon)
    );
    
    // Estimate duration based on distance (assuming average speed of 50 km/h)
    // 50 km/h = 13.89 m/s
    const estimatedDuration = directDistance / 13.89;
    
    const fallbackRoute: ActionState<OsrmRoute> = {
      isSuccess: true as const,
      message: "Route estimated (API error)",
      data: {
        distance: directDistance,
        duration: estimatedDuration,
        geometry: {
          coordinates: [
            [parseFloat(startLon), parseFloat(startLat)],
            [parseFloat(endLon), parseFloat(endLat)]
          ],
          type: "LineString"
        }
      }
    };
    
    console.log('[Route Calculation] Returning fallback route:', fallbackRoute);
    return fallbackRoute;
  }

  const data = await response.json()
  console.log('[Route Calculation] OSRM response:', data);
  
  if (!data || !data.routes || data.routes.length === 0) {
    console.error('[Route Calculation] No route found in OSRM response');
    return {
      isSuccess: false as const,
      message: "No route found between the provided locations"
    }
  }

  // Ensure the route data has the correct structure
  const routeData = data.routes[0];
  if (!routeData.distance || !routeData.duration) {
    console.error('[Route Calculation] Route data missing required fields:', routeData);
    return {
      isSuccess: false as const,
      message: "Route data is incomplete"
    }
  }

  const route: ActionState<OsrmRoute> = {
    isSuccess: true as const,
    message: "Route calculated successfully",
    data: {
      distance: routeData.distance,
      duration: routeData.duration,
      geometry: routeData.geometry
    }
  };
  
  console.log('[Route Calculation] Returning calculated route:', route);
  return route;
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

  // --- Validation Start ---
  const validationResult = RouteCoordinatesSchema.safeParse(params);
  if (!validationResult.success) {
    const errorMessage = formatZodError(validationResult.error);
    console.error("Validation failed for calculateMidpointAction:", errorMessage);
    return {
      isSuccess: false,
      message: `Invalid input: ${errorMessage}`,
    };
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

// Copied getMidpoint function from results-map.tsx
function getMidpoint(route: any): { lat: number; lng: number } | null {
  if (!route || !route.geometry || !route.geometry.coordinates || !route.distance) return null

  const coordinates = route.geometry.coordinates
  const totalDistance = route.distance

  if (coordinates.length < 2) return null;

  // Find the point closest to 50% of the total distance
  let cumulativeDistance = 0

  for (let i = 0; i < coordinates.length - 1; i++) {
    const point1 = coordinates[i]
    const point2 = coordinates[i + 1]

    // Ensure points are valid arrays of numbers
    if (!Array.isArray(point1) || point1.length < 2 || !Array.isArray(point2) || point2.length < 2) {
      console.warn('[getMidpoint] Invalid coordinate points:', point1, point2);
      continue; // Skip invalid segment
    }

    const lat1 = point1[1]
    const lon1 = point1[0]
    const lat2 = point2[1]
    const lon2 = point2[0]

    // Ensure coordinates are numbers
    if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || typeof lat2 !== 'number' || typeof lon2 !== 'number') {
      console.warn('[getMidpoint] Non-numeric coordinates in segment:', lat1, lon1, lat2, lon2);
      continue; // Skip invalid segment
    }

    const segmentDistance = calculateDistance(lat1, lon1, lat2, lon2);

    if (cumulativeDistance + segmentDistance >= totalDistance / 2) {
      // The midpoint lies on this segment
      const ratio = (totalDistance / 2 - cumulativeDistance) / segmentDistance;
      // Check for division by zero or invalid ratio
      if (isNaN(ratio) || !isFinite(ratio)) {
         console.warn('[getMidpoint] Invalid ratio calculation, using segment start.', { totalDistance, cumulativeDistance, segmentDistance });
         return { lat: lat1, lng: lon1 };
      }
      const midLat = lat1 + ratio * (lat2 - lat1)
      const midLon = lon1 + ratio * (lon2 - lon1)
      // Final check for valid midpoint coordinates
      if (isNaN(midLat) || isNaN(midLon)) {
         console.warn('[getMidpoint] Calculated midpoint coordinates are NaN.');
         return { lat: lat1, lng: lon1 }; // Fallback to segment start
      }
      return { lat: midLat, lng: midLon }
    }
    cumulativeDistance += segmentDistance
  }

  // Fallback: If midpoint wasn't found in loop (e.g., due to coordinate issues or floating point errors),
  // return the coordinates of the last point as a best guess.
  console.warn('[getMidpoint] Midpoint not found along segments, returning last point.');
  const lastPoint = coordinates[coordinates.length - 1];
  if (Array.isArray(lastPoint) && lastPoint.length >= 2 && typeof lastPoint[0] === 'number' && typeof lastPoint[1] === 'number') {
      return { lat: lastPoint[1], lng: lastPoint[0] };
  }

  return null; // Return null if no valid midpoint could be determined
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
): Promise<ActionState<OsrmRoute>> {

  // --- Validation Start ---
  const validationResult = RouteCoordinatesSchema.safeParse(params);
  if (!validationResult.success) {
    const errorMessage = formatZodError(validationResult.error);
    console.error("Validation failed for getAlternateRouteAction:", errorMessage);
    return {
      isSuccess: false,
      message: `Invalid input: ${errorMessage}`,
    };
  }
  const { startLat, startLon, endLat, endLon } = validationResult.data;
  // --- Validation End ---

  console.log(`[OSRM Alt Route] Requesting alternate routes from (${startLat}, ${startLon}) to (${endLat}, ${endLon})`);
  const profile = "driving";

  try {
    // Request route with up to 2 alternatives using OSRM
    const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson&alternatives=3`

    const response = await rateLimitedFetch(url)
    if (!response.ok) {
      console.warn(`OSRM API error for alternate route: ${response.statusText}. Using fallback route data.`);
      return createFallbackRoute(startLat, startLon, endLat, endLon);
    }

    const data = await response.json()
    // Ensure we have routes and at least a main route
    if (!data || !data.routes || data.routes.length === 0) {
      console.warn(`OSRM returned no routes. Using fallback.`);
      return createFallbackRoute(startLat, startLon, endLat, endLon);
    }

    // Cast response routes to the correct type
    const mainRoute = data.routes[0] as OsrmRoute;
    const potentialAlternatives = (data.routes.slice(1) as OsrmRoute[]) || [];

    // Filter for reasonable alternatives
    const reasonableAlternatives = potentialAlternatives.filter((route: OsrmRoute) => 
      route.distance <= mainRoute.distance * 1.4 && // Max 40% longer distance
      route.duration <= mainRoute.duration * 1.5   // Max 50% longer duration
    );

    let selectedAlternative: OsrmRoute | null = null;

    if (reasonableAlternatives.length === 0) {
      console.log("No reasonable alternatives found. Using fallback.");
      return createFallbackRoute(startLat, startLon, endLat, endLon);
    } else if (reasonableAlternatives.length === 1) {
      console.log("One reasonable alternative found.");
      selectedAlternative = reasonableAlternatives[0];
    } else {
      console.log("Multiple reasonable alternatives found. Selecting the most geographically different.");
      // Find the one whose midpoint is furthest from the main route's midpoint
      const mainMidpoint = getMidpoint(mainRoute);
      if (!mainMidpoint) {
         console.warn("Could not calculate main route midpoint. Selecting the first reasonable alternative.");
         selectedAlternative = reasonableAlternatives[0];
      } else {
        let maxMidpointDistance = -1;
        reasonableAlternatives.forEach(alt => {
          const altMidpoint = getMidpoint(alt);
          if (altMidpoint) {
            const distance = calculateDistance(
              mainMidpoint.lat, mainMidpoint.lng, 
              altMidpoint.lat, altMidpoint.lng
            );
            if (distance > maxMidpointDistance) {
              maxMidpointDistance = distance;
              selectedAlternative = alt;
            }
          } else {
             console.warn("Could not calculate midpoint for an alternative route.");
          }
        });
        // Fallback if midpoints couldn't be calculated for any alternatives
        if (!selectedAlternative) {
           console.warn("Could not determine most different alternative based on midpoints. Selecting first reasonable.");
           selectedAlternative = reasonableAlternatives[0];
        }
      }
    }

    if (selectedAlternative) {
      return {
        isSuccess: true as const,
        message: "Alternate route calculated successfully",
        data: selectedAlternative
      }
    } else {
      // This case should theoretically be covered by the initial checks, but as a safeguard:
      console.log("Failed to select an alternative. Using fallback.");
      return createFallbackRoute(startLat, startLon, endLat, endLon);
    }
  } catch (error) {
    console.error("Error calculating alternate route:", error)
    return createFallbackRoute(startLat, startLon, endLat, endLon);
  }
}

// Helper function to create a fallback route
function createFallbackRoute(startLat: string, startLon: string, endLat: string, endLon: string): ActionState<OsrmRoute> {
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
      message: "Failed to calculate alternate route and fallback also failed",
      data: undefined // Or provide a default empty route structure if needed downstream
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

  // --- Validation Start ---
  const validationResult = RouteCoordinatesSchema.safeParse(params);
  if (!validationResult.success) {
    const errorMessage = formatZodError(validationResult.error);
    console.error("Validation failed for calculateAlternateMidpointAction:", errorMessage);
    return {
      isSuccess: false,
      message: `Invalid input: ${errorMessage}`,
    };
  }
  const { startLat, startLon, endLat, endLon } = validationResult.data;
  // --- Validation End ---

  console.log(`[Alt Midpoint Calc] Calculating alt midpoint between (${startLat}, ${startLon}) and (${endLat}, ${endLon})`);
  try {
    // Get the alternate route first
    const routeResult = await getAlternateRouteAction({ startLat, startLon, endLat, endLon })
    
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
      message: "Alternate midpoint calculated successfully",
      data: {
        lat: midpointLat.toString(),
        lon: midpointLon.toString()
      }
    }
  } catch (error) {
    console.error("Error calculating alternate midpoint:", error)
    return { isSuccess: false, message: "Failed to calculate alternate midpoint" }
  }
} 