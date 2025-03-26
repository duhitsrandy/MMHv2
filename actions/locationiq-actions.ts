"use server"

import { ActionState } from "@/types"
import { PoiResponse } from "@/types"

// Simple rate limiting implementation
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 500; // Reduced to 500ms (2 requests per second)

// Simple in-memory cache
const apiCache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Helper function to enforce rate limiting with retry logic
async function rateLimitedFetch(url: string, maxRetries = 3): Promise<Response> {
  // Check cache first
  if (apiCache[url] && (Date.now() - apiCache[url].timestamp) < CACHE_TTL) {
    return {
      ok: true,
      json: async () => apiCache[url].data,
      text: async () => JSON.stringify(apiCache[url].data),
      status: 200,
      statusText: 'OK (Cached)'
    } as Response;
  }

  let retries = 0;
  let lastError: Error | null = null;

  while (retries < maxRetries) {
    try {
      // Enforce rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
      }

      // Make the request
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Meet-Me-Halfway/1.0',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      // Update last request time
      lastRequestTime = Date.now();

      // Cache successful responses
      if (response.ok) {
        const data = await response.clone().json();
        apiCache[url] = {
          data,
          timestamp: Date.now()
        };
      }

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
  try {
    console.log('Geocoding address:', address);
    const apiKey = process.env.NEXT_PUBLIC_LOCATIONIQ_KEY;
    if (!apiKey) {
      console.error('LocationIQ API key is missing');
      return {
        isSuccess: false,
        message: "LocationIQ API key is not configured"
      };
    }

    const url = `https://us1.locationiq.com/v1/search.php?key=${apiKey}&q=${encodeURIComponent(
      address
    )}&format=json&limit=1`;

    try {
      const response = await rateLimitedFetch(url);
      console.log('LocationIQ API response status:', response.status);

      if (!response.ok) {
        console.warn(`LocationIQ API error: ${response.statusText}. Trying fallback.`);
        return fallbackGeocodeAction(address);
      }

      const data = await response.json();
      console.log('LocationIQ API response:', data);

      if (!data || data.length === 0) {
        console.warn('No results from LocationIQ. Trying fallback.');
        return fallbackGeocodeAction(address);
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
      return fallbackGeocodeAction(address);
    }
  } catch (error) {
    console.error("Error geocoding location:", error);
    return { isSuccess: false, message: "Failed to geocode location" };
  }
}

// Add this new function to search POIs using Overpass API
export async function searchPoisAction(
  lat: string,
  lon: string,
  radius: number = 1500,
  types: string[] = ["restaurant", "cafe", "bar", "park", "library", "cinema", "theatre", "museum", "hotel"]
): Promise<ActionState<PoiResponse[]>> {
  console.log(`[POI Search] Starting search at ${lat},${lon} with radius ${radius}m`);
  
  try {
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout

    // Build a more comprehensive query
    const amenityTypes = ["restaurant", "cafe", "bar", "library", "cinema", "theatre", "hospital", "marketplace"];
    const leisureTypes = ["park", "garden", "playground", "sports_centre"];
    const tourismTypes = ["museum", "hotel", "gallery", "attraction", "viewpoint"];
    const shopTypes = ["supermarket", "mall", "department_store", "bakery", "convenience"];
    
    // Simple, direct Overpass query with common POI types
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
      out body center;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[POI Search] Overpass API error: ${response.status} ${response.statusText}`);
      throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
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
            road: poi.tags?.['addr:street'] || '',
            house_number: poi.tags?.['addr:housenumber'] || '',
            city: poi.tags?.['addr:city'] || '',
            state: poi.tags?.['addr:state'] || '',
            country: poi.tags?.['addr:country'] || ''
          }
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
      .slice(0, 8); // Back to 8 POIs per route
    
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
  startLat: string,
  startLon: string,
  endLat: string,
  endLon: string
): Promise<ActionState<any>> {
  try {
    // Validate coordinates
    if (!startLat || !startLon || !endLat || !endLon) {
      return {
        isSuccess: false,
        message: "Missing coordinates for route calculation"
      }
    }
    
    // Ensure coordinates are valid numbers
    const coords = [
      parseFloat(startLat), parseFloat(startLon),
      parseFloat(endLat), parseFloat(endLon)
    ];
    
    if (coords.some(isNaN)) {
      return {
        isSuccess: false,
        message: "Invalid coordinates for route calculation"
      }
    }
    
    // Using OSRM for routing
    const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`

    const response = await rateLimitedFetch(url)
    if (!response.ok) {
      console.warn(`OSRM API error: ${response.statusText}. Using fallback route data.`);
      
      // Return a fallback route with estimated data
      // This is better than failing completely
      const directDistance = calculateDistance(
        parseFloat(startLat), parseFloat(startLon),
        parseFloat(endLat), parseFloat(endLon)
      );
      
      // Estimate duration based on distance (assuming average speed of 50 km/h)
      // 50 km/h = 13.89 m/s
      const estimatedDuration = directDistance / 13.89;
      
      // Create a simple straight-line route as fallback
      return {
        isSuccess: true,
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
      }
    }

    const data = await response.json()
    if (!data || !data.routes || data.routes.length === 0) {
      return {
        isSuccess: false,
        message: "No route found between the provided locations"
      }
    }

    return {
      isSuccess: true,
      message: "Route calculated successfully",
      data: data.routes[0]
    }
  } catch (error) {
    console.error("Error calculating route:", error)
    
    // Return a fallback route with estimated data
    try {
      const directDistance = calculateDistance(
        parseFloat(startLat), parseFloat(startLon),
        parseFloat(endLat), parseFloat(endLon)
      );
      
      // Estimate duration based on distance (assuming average speed of 50 km/h)
      // 50 km/h = 13.89 m/s
      const estimatedDuration = directDistance / 13.89;
      
      return {
        isSuccess: true,
        message: "Route estimated (error fallback)",
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
      }
    } catch (fallbackError) {
      return { 
        isSuccess: false, 
        message: "Failed to calculate route and fallback also failed" 
      }
    }
  }
}

export async function calculateMidpointAction(
  startLat: string,
  startLon: string,
  endLat: string,
  endLon: string
): Promise<ActionState<{ lat: string; lon: string }>> {
  try {
    // Get the route first
    const routeResult = await getRouteAction(startLat, startLon, endLat, endLon)
    
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

    // Define route type
    interface RouteData {
      distance: number;
      duration: number;
      geometry: {
        coordinates: [number, number][];
        type: string;
      };
    }

    // Request route with alternatives using OSRM
    const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson&alternatives=true`

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
      const mainRoute = data.routes[0] as RouteData;
      const alternatives = data.routes.slice(1) as RouteData[];
      
      // Find a suitable alternative that isn't too much longer
      const suitableAlternative = alternatives.find((route: RouteData) => 
        route.distance <= mainRoute.distance * 1.4 // Max 40% longer
      );

      if (suitableAlternative) {
        return {
          isSuccess: true as const,
          message: "Alternate route calculated successfully",
          data: suitableAlternative
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
      message: "Failed to calculate alternate route and fallback also failed" 
    }
  }
}

// Also add a function to calculate the midpoint for the alternate route
export async function calculateAlternateMidpointAction(
  startLat: string,
  startLon: string,
  endLat: string,
  endLon: string
): Promise<ActionState<{ lat: string; lon: string }>> {
  try {
    // Get the alternate route first
    const routeResult = await getAlternateRouteAction(startLat, startLon, endLat, endLon)
    
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

// Helper function to calculate distance between two points using the Haversine formula
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